/**
 * @description
 * This service is the sole gateway for all interactions with the Allora blockchain.
 * It abstracts the complexities of the `allorad` CLI tool and CosmJS libraries,
 * providing a clean, Promise-based, and typed interface to the rest of the application.
 *
 * This service implements critical non-functional requirements:
 * - **Isolation:** No other part of the application can directly interact with
 *   the blockchain. This centralizes logic and simplifies maintenance.
 * - **Reliability:** All external calls are wrapped in a retry mechanism with
 *   exponential backoff to handle transient network or RPC node issues.
 *
 * @dependencies
 * - child_process: To execute `allorad` shell commands for queries.
 * - @cosmjs/stargate: For building, signing, and broadcasting transactions.
 * - @cosmjs/proto-signing: For wallet generation from mnemonics and handling custom messages.
 * - @/config: For accessing the Allora RPC URL and other chain configs.
 * - @/utils/logger: For structured logging of all operations.
 * - ./allora-connector.types: For typing the parsed JSON outputs.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import {
  SigningStargateClient,
  GasPrice,
  Coin,
  DeliverTxResponse,
  isDeliverTxFailure,
  defaultRegistryTypes
} from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, Registry, EncodeObject } from '@cosmjs/proto-signing';
import { Secp256k1, sha256 } from '@cosmjs/crypto';
import { EnglishMnemonic, Bip39, Slip10, Slip10Curve, Slip10RawIndex } from '@cosmjs/crypto';
import * as yaml from 'js-yaml';
import stableStringify from 'canonical-json';
import { config } from '@/config';
import { formatToBoundedExp40Dec } from './bounded-exp40dec';
import logger from '@/utils/logger';
import {
  AlloraBalance,
  TopicDetails,
  ExecResult,
  AlloraWorkerPerformance,
  AlloraEmaScore,
  WorkerResponsePayload
} from './allora-connector.types';
import {
  InputInference,
  InputForecast,
  InputInferenceForecastBundle,
  InputForecastElement,
  InputWorkerDataBundle,
  InsertWorkerPayloadRequest
} from '@/generated/allora_worker';

const execAsync = promisify(exec);

// Define the type URLs for our custom messages. These must match the definitions on the Allora chain.
// Note: Using v9 for worker payloads, v1 for legacy inference submissions
const msgInsertInferenceTypeUrl = "/emissions.v1.MsgInsertInferences";
// For ADR-031 style Msg service, the type URL is the fully-qualified request message name
const msgInsertWorkerPayloadTypeUrl = "/emissions.v9.InsertWorkerPayloadRequest";

class AlloraConnectorService {
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_DELAY_MS = 1000;
  // As per docs, a reasonable default gas price for internal transactions
  private readonly TREASURY_GAS_PRICE = '10uallo';
  // As per docs, a universal gas limit for transactions like bank sends.
  private readonly UNIVERSAL_GAS_LIMIT = '200000';
  // Gas limit for submitting inferences might be higher. This is a placeholder and should be tuned.
  private readonly INFERENCE_GAS_LIMIT = '200000';

  private readonly registry: Registry;

  constructor() {
    // Create a new Registry instance, including all default Cosmos SDK message types
    const registry = new Registry();
    // Add default registry types
    Object.entries(defaultRegistryTypes).forEach(([key, value]) => {
      registry.register(key, value as any);
    });

    // Removed legacy mock registration for msgInsertInferenceTypeUrl; requires proper v1 protos


    // Register v9 InsertWorkerPayloadRequest using generated encoder/decoder
    registry.register(msgInsertWorkerPayloadTypeUrl, InsertWorkerPayloadRequest as any);

    this.registry = registry;
    logger.info('AlloraConnectorService initialized with custom message types.');
  }


  /**
   * Executes a shell command with a robust retry mechanism.
   * This is the core function for all blockchain queries.
   * @param command The full shell command to execute.
   * @returns A Promise resolving to an ExecResult tuple.
   */
  private async execAsyncWithRetry(command: string): Promise<ExecResult> {
    let delay = this.INITIAL_DELAY_MS;
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        logger.debug({ attempt: i + 1, command }, 'Executing allorad command');

        // First, let's check if allorad is available
        if (i === 0) {
          try {
            const { stdout: versionOutput } = await execAsync('allorad version', {
              env: {
                ...process.env,
                ALLORA_CHAIN_ID: config.CHAIN_ID,
                ALLORA_RPC_URL: config.ALLORA_RPC_URL
              }
            });
            logger.info({ versionOutput }, 'Allorad version check successful');
          } catch (versionError) {
            logger.error({ versionError }, 'Allorad version check failed - binary may not be available');
          }
        }

        // Log the environment variables being used
        logger.debug({
          ALLORA_CHAIN_ID: config.CHAIN_ID,
          ALLORA_RPC_URL: config.ALLORA_RPC_URL
        }, 'Allorad environment configuration');

        const { stdout, stderr } = await execAsync(command, {
          env: {
            ...process.env,
            ALLORA_CHAIN_ID: config.CHAIN_ID,
            ALLORA_RPC_URL: config.ALLORA_RPC_URL,
          }
        });
        logger.debug({ stdout, stderr, command }, 'Allorad command completed');
        if (stderr) {
          if (stderr.toLowerCase().includes('error')) {
            throw new Error(stderr);
          }
          logger.warn({ stderr, command }, 'Stderr reported from allorad command');
        }
        return [stdout, null];
      } catch (error) {
        logger.error(
          { err: error, attempt: i + 1, command, errorMessage: (error as Error).message },
          `Attempt ${i + 1} failed for command.`
        );
        if (i === this.MAX_RETRIES - 1) {
          return [null, error as Error];
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    return [null, new Error('Exhausted all retries.')];
  }

  /**
   * Parses a coin string (e.g., "1000uallo") into a Coin object.
   * @param amountStr The string to parse.
   * @returns A Coin object or null if parsing fails.
   */
  private parseAmount(amountStr: string): Coin | null {
    const match = amountStr.match(/^(\d+)([a-zA-Z]+)$/);
    if (!match) {
      logger.error({ amountStr }, 'Invalid amount string format.');
      return null;
    }
    return {
      amount: match[1],
      denom: match[2],
    };
  }

  /**
   * Fetches details for a specific topic and checks if it's active.
   * @param topicId The ID of the topic to query.
   * @returns A promise resolving to TopicDetails or null if not found/error.
   */
  public async getTopicDetails(topicId: string): Promise<TopicDetails | null> {
    const getTopicCmd = `allorad query emissions topic ${topicId}`;
    const [topicStdout, topicErr] = await this.execAsyncWithRetry(getTopicCmd);

    if (topicErr) {
      logger.error({ err: topicErr, topicId }, 'Failed to get topic details from chain.');
      return null;
    }

    const isActiveCmd = `allorad query emissions is-topic-active ${topicId}`;
    const [activeStdout, activeErr] = await this.execAsyncWithRetry(isActiveCmd);

    if (activeErr) {
      logger.error({ err: activeErr, topicId }, 'Failed to check if topic is active.');
      return null;
    }

    try {
      // Parse the isActive response (JSON)
      // Try YAML/text first; some nodes may not return JSON
      let isActive = false;
      try {
        const activeYaml: any = yaml.load(activeStdout!);
        const raw = activeYaml?.is_topic_active ?? activeYaml?.active ?? activeYaml?.value ?? activeYaml?.result;
        if (typeof raw === 'boolean') isActive = raw;
        else if (typeof raw === 'string') isActive = raw.toLowerCase() === 'true';
      } catch { }
      // Fallback: JSON parse if applicable
      if (!isActive) {
        try {
          const isActiveData = JSON.parse(activeStdout!);
          isActive = typeof isActiveData === 'boolean' ? isActiveData : Boolean(isActiveData.is_active ?? isActiveData.value);
        } catch { }
      }

      // Parse the topic response using proper YAML parser
      const topicData = yaml.load(topicStdout!.trim()) as any;

      // Extract topic information from the parsed YAML
      const topic = topicData.topic;
      const topicId = topic?.id;
      const epochLength = parseInt(topic?.epoch_length || '0', 10);
      const creator = topic?.creator;
      const metadata = topic?.metadata;

      logger.debug({ topicId, epochLength, creator, metadata, isActive, topicStdout }, 'Parsed topic details');

      if (!topicId || !epochLength || !creator) {
        logger.warn({ topicId: topicId, epochLength, creator, output: topicStdout }, 'Topic data incomplete in chain response.');
        return null;
      }

      return {
        id: topicId,
        epochLength: epochLength,
        isActive: isActive,
        creator: creator,
        metadata: metadata,
      };
    } catch (parseError) {
      logger.error({ err: parseError, topicId, activeStdout }, 'Failed to parse allorad output.');
      return null;
    }
  }

  /**
   * Fetches the uallo balance for a given wallet address.
   * @param address The Allora wallet address.
   * @returns A promise resolving to the balance as a number, or null on error.
   */
  public async getAccountBalance(address: string): Promise<number | null> {
    const command = `allorad query bank balances ${address} --output json --node ${config.ALLORA_RPC_URL}`;
    const [stdout, error] = await this.execAsyncWithRetry(command);

    if (error) {
      logger.error({ err: error, address }, 'Failed to get account balance.');
      return null;
    }

    try {
      const balanceData = JSON.parse(stdout!) as { balances: AlloraBalance[] };
      const alloBalance = balanceData.balances.find((b) => b.denom === 'uallo');

      if (!alloBalance) {
        logger.warn({ address }, 'uallo balance not found for address, returning 0.');
        return 0;
      }

      return parseInt(alloBalance.amount, 10);
    } catch (parseError) {
      logger.error({ err: parseError, address }, 'Failed to parse balance output.');
      return null;
    }
  }

  /**
   * Fetches performance metrics for a specific worker on a given topic.
   * Currently, this fetches the worker's EMA score.
   *
   * @param topicId The ID of the topic.
   * @param workerAddress The public address of the worker's wallet.
   * @returns A promise resolving to the worker's performance data, or null on failure.
   */
  public async getWorkerPerformance(topicId: string, workerAddress: string): Promise<AlloraWorkerPerformance | null> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getWorkerPerformance', topicId, workerAddress });

    try {
      log.info('Fetching worker performance from Allora network');

      const getEmaScoreCmd = `allorad query emissions inferer-score-ema ${topicId} ${workerAddress} --node ${config.ALLORA_RPC_URL}`;
      const [stdout, error] = await this.execAsyncWithRetry(getEmaScoreCmd);

      if (error) {
        log.error({ err: error }, 'Failed to get worker performance');
        return null;
      }

      // Parse the JSON output
      const emaScoreData = JSON.parse(stdout!.trim()) as AlloraEmaScore;

      log.info('Successfully retrieved worker performance');
      return {
        topicId,
        workerAddress,
        emaScore: emaScoreData.score
      };

    } catch (error: any) {
      log.error({ err: error }, 'Failed to get worker performance');
      return null;
    }
  }

  /**
   * Sends a specified amount of tokens from a wallet (identified by its
   * mnemonic) to a recipient address. This is primarily used for funding
   * new model wallets from the central treasury.
   *
   * @param fromMnemonic The mnemonic phrase of the sender's wallet.
   * @param toAddress The recipient's public address.
   * @param amount The amount to send, as a string (e.g., "50000uallo").
   * @returns A promise resolving to an object with the transaction hash, or null on failure.
   */
  public async transferFunds(
    fromMnemonic: string,
    toAddress: string,
    amount: string
  ): Promise<{ txHash: string } | null> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'transferFunds' });
    let delay = this.INITIAL_DELAY_MS;

    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        log.info({ attempt: i + 1, toAddress, amount }, 'Attempting to transfer funds.');

        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(fromMnemonic, { prefix: 'allo' });
        const [fromAccount] = await wallet.getAccounts();

        const coinsToSend = this.parseAmount(amount);
        if (!coinsToSend) {
          throw new Error(`Invalid amount format: ${amount}`);
        }

        const gasPrice = GasPrice.fromString(this.TREASURY_GAS_PRICE);
        const signingClient = await SigningStargateClient.connectWithSigner(config.ALLORA_RPC_URL, wallet, {
          registry: this.registry,
          gasPrice,
        });

        // Calculate the fee amount based on gas limit and gas price
        const gasLimit = parseInt(this.UNIVERSAL_GAS_LIMIT);
        const gasPriceAmount = parseInt(this.TREASURY_GAS_PRICE.replace('uallo', ''));
        const feeAmount = gasLimit * gasPriceAmount;

        const fee = {
          amount: [{ denom: 'uallo', amount: feeAmount.toString() }],
          gas: this.UNIVERSAL_GAS_LIMIT,
        };

        const result: DeliverTxResponse = await signingClient.sendTokens(
          fromAccount.address,
          toAddress,
          [coinsToSend],
          fee,
          'Funding new model wallet'
        );

        if (isDeliverTxFailure(result)) {
          throw new Error(`Transaction failed: ${result.rawLog}`);
        }

        log.info({ txHash: result.transactionHash, toAddress }, 'Fund transfer successful.');
        return { txHash: result.transactionHash };

      } catch (error) {
        log.error({ err: error, attempt: i + 1 }, `Attempt ${i + 1} to transfer funds failed.`);
        if (i === this.MAX_RETRIES - 1) {
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    return null;
  }

  /**
 * Constructs, signs, and broadcasts a transaction to submit an inference
 * for a specific topic to the Allora chain.
 *
 * @param signingMnemonic The mnemonic of the model's isolated wallet.
 * @param topicId The ID of the topic to submit the inference to.
 * @param inferenceData The inference data from the model's webhook.
 * @param gasPrice The gas price to use, respecting the user's `max_gas_price`.
 * @returns A promise resolving to an object with the transaction hash, or null on failure.
 */
  public async submitInference(
    signingMnemonic: string,
    topicId: string,
    inferenceData: { value: string },
    gasPrice: string
  ): Promise<{ txHash: string } | null> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'submitInference', topicId });
    log.warn('submitInference (v1) is not supported without v1 protos. Use submitWorkerPayload (v9) instead.');
    throw new Error('Legacy submitInference is unsupported: missing v1 message protos.');
  }

  /**
   * Get latest network inferences for a topic
   */
  public async getLatestNetworkInferences(topicId: string): Promise<any> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getLatestNetworkInferences', topicId });

    try {
      log.info('Fetching latest network inferences from Allora network');

      const command = `allorad query emissions latest-network-inferences ${topicId}`;
      const [stdout, error] = await this.execAsyncWithRetry(command);

      if (error) {
        log.error({ err: error }, 'Failed to get latest network inferences');
        return {};
      }

      // Parse the JSON output
      const latestInferences = JSON.parse(stdout!.trim());

      log.info('Successfully retrieved latest network inferences');
      return latestInferences;

    } catch (error: any) {
      log.error({ err: error }, 'Failed to get latest network inferences');
      return {};
    }
  }

  /**
   * Get active inferers for a topic
   */
  public async getActiveInferers(topicId: string): Promise<any> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getActiveInferers', topicId });

    try {
      log.info('Fetching active inferers from Allora network');

      const command = `allorad query emissions active-inferers ${topicId}`;
      const [stdout, error] = await this.execAsyncWithRetry(command);

      if (error) {
        log.error({ err: error }, 'Failed to get active inferers');
        return {};
      }

      // Parse the JSON output
      const activeInferers = JSON.parse(stdout!.trim());

      log.info('Successfully retrieved active inferers');
      return activeInferers;

    } catch (error: any) {
      log.error({ err: error }, 'Failed to get active inferers');
      return {};
    }
  }

  /**
   * Get active forecasters for a topic
   */
  public async getActiveForecasters(topicId: string): Promise<any> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getActiveForecasters', topicId });

    try {
      log.info('Fetching active forecasters from Allora network');

      const command = `allorad query emissions active-forecasters ${topicId}`;
      const [stdout, error] = await this.execAsyncWithRetry(command);

      if (error) {
        log.error({ err: error }, 'Failed to get active forecasters');
        return {};
      }

      // Parse the JSON output
      const activeForecasters = JSON.parse(stdout!.trim());

      log.info('Successfully retrieved active forecasters');
      return activeForecasters;

    } catch (error: any) {
      log.error({ err: error }, 'Failed to get active forecasters');
      return {};
    }
  }

  /**
   * Get active reputers for a topic
   */
  public async getActiveReputers(topicId: string): Promise<any> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getActiveReputers', topicId });

    try {
      log.info('Fetching active reputers from Allora network');

      const command = `allorad query emissions active-reputers ${topicId}`;
      const [stdout, error] = await this.execAsyncWithRetry(command);

      if (error) {
        log.error({ err: error }, 'Failed to get active reputers');
        return {};
      }

      // The active-reputers command returns YAML format, not JSON
      const activeReputers = yaml.load(stdout!.trim()) as any;

      log.info('Successfully retrieved active reputers');
      return activeReputers;

    } catch (error: any) {
      log.error({ err: error }, 'Failed to get active reputers');
      return {};
    }
  }

  /**
 * Submit a worker payload (inference and forecasts) to the Allora blockchain using V2 format
 */
  /**
   * Validates that the worker data bundle matches the protocol requirements
   */
  private validateWorkerDataBundle(bundle: InputWorkerDataBundle): void {
    if (!bundle.worker || !bundle.topicId || !bundle.nonce) {
      throw new Error('Missing required fields in worker data bundle');
    }

    if (!bundle.inferenceForecastsBundle) {
      throw new Error('Missing inferenceForecastsBundle');
    }

    if (!bundle.inferencesForecastsBundleSignature || !bundle.pubkey) {
      throw new Error('Missing signature or public key');
    }

    // Validate nonce structure
    if (!bundle.nonce.blockHeight) {
      throw new Error('Missing blockHeight in nonce');
    }

    // Validate bundle contents
    const { inference, forecast } = bundle.inferenceForecastsBundle;
    if (!inference && !forecast) {
      throw new Error('At least one of inference or forecast must be provided');
    }

    if (inference) {
      if (typeof inference.topicId !== 'number' || typeof inference.blockHeight !== 'number' || !inference.inferer || !inference.value) {
        throw new Error('Missing required fields in inference');
      }
      // Validate protocol fields are present (even if empty)
      if (!(inference.extraData instanceof Uint8Array) || typeof inference.proof !== 'string') {
        throw new Error('Invalid protocol fields in inference');
      }
    }

    if (forecast) {
      if (typeof forecast.topicId !== 'number' || typeof forecast.blockHeight !== 'number' || !forecast.forecaster || !forecast.forecastElements) {
        throw new Error('Missing required fields in forecast');
      }
      // Validate protocol fields are present (even if empty)
      if (!(forecast.extraData instanceof Uint8Array)) {
        throw new Error('Invalid protocol fields in forecast');
      }

      if (forecast.forecastElements.length === 0) {
        throw new Error('Forecast must have at least one forecast element');
      }

      for (const element of forecast.forecastElements) {
        if (!element.inferer || !element.value) {
          throw new Error('Invalid forecast element structure');
        }
      }
    }
  }

  public async submitWorkerPayload(
    signingMnemonic: string,
    topicId: string,
    workerResponse: WorkerResponsePayload,
    gasPrice: string,
    nonceHeight?: number
  ): Promise<{ txHash: string } | null> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'submitWorkerPayload', topicId });
    let delay = this.INITIAL_DELAY_MS;

    let senderAddress: string = 'unknown';
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        log.info({ attempt: i + 1, topicId }, 'Attempting to submit worker payload.');

        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(signingMnemonic, { prefix: 'allo' });
        const [account] = await wallet.getAccounts();
        senderAddress = account.address;

        const client = await SigningStargateClient.connectWithSigner(config.ALLORA_RPC_URL, wallet, {
          registry: this.registry,
          gasPrice: GasPrice.fromString(gasPrice),
        });

        // Determine target nonce height: prefer explicit param, else query API for open worker nonce
        let targetNonceHeight: number | null = null;
        if (typeof nonceHeight === 'number' && Number.isFinite(nonceHeight)) {
          targetNonceHeight = nonceHeight;
        } else {
          targetNonceHeight = await this.deriveLatestOpenWorkerNonce(topicId);
          if (targetNonceHeight == null) {
            log.info({ topicId }, 'No open worker nonce available; skipping submission.');
            return null;
          }
        }
        const blockHeightStr = String(targetNonceHeight);

        // Construct the inference payload if inferenceValue is provided
        let inference: InputInference | undefined = undefined;
        if (workerResponse.inferenceValue) {
          inference = {
            topicId: Number(topicId), // Convert to uint64 as per protocol
            blockHeight: Number(blockHeightStr), // Convert to int64 as per protocol (nonce height)
            inferer: senderAddress,
            value: formatToBoundedExp40Dec(workerResponse.inferenceValue),
            // Optional protocol fields - set explicit defaults for protobuf compatibility
            extraData: workerResponse.extraData || new Uint8Array(0), // Empty Uint8Array if not provided
            proof: workerResponse.proof || "", // Empty string if not provided
          };
        }

        // Construct the forecast payload if forecasts are provided
        let forecast: InputForecast | undefined = undefined;
        if (workerResponse.forecasts && workerResponse.forecasts.length > 0) {
          const forecastElements: InputForecastElement[] = [];
          for (const f of workerResponse.forecasts) {
            try {
              forecastElements.push({ inferer: f.workerAddress, value: formatToBoundedExp40Dec(f.forecastedValue) });
            } catch (e: any) {
              if (e?.message === 'SKIP_SUBMISSION') {
                logger.warn({ f }, 'Skipping invalid forecast element due to policy');
                continue;
              }
              throw e;
            }
          }
          if (forecastElements.length === 0) {
            logger.warn('All forecast elements skipped by policy; omitting forecast');
          }

          forecast = {
            topicId: Number(topicId), // Convert to uint64 as per protocol
            blockHeight: Number(blockHeightStr), // Convert to int64 as per protocol (nonce height)
            forecaster: senderAddress,
            forecastElements: forecastElements,
            // Optional protocol field - set explicit default for protobuf compatibility
            extraData: workerResponse.forecastExtraData || new Uint8Array(0), // Empty Uint8Array if not provided
          };
        }

        // Create the bundle
        const bundle: InputInferenceForecastBundle = {
          inference: inference,
          forecast: forecast,
        };

        // Create an instance of the generated class for the bundle
        const bundleProto = InputInferenceForecastBundle.fromPartial(bundle);

        // Use the generated .encode() method to get the binary data
        const messageBytes = InputInferenceForecastBundle.encode(bundleProto).finish();

        // Hash and sign the binary data
        const messageHash = sha256(messageBytes);

        // Derive private key from mnemonic
        const mnemonic = new EnglishMnemonic(signingMnemonic);
        const seed = await Bip39.mnemonicToSeed(mnemonic);
        const path = [
          Slip10RawIndex.hardened(44),
          Slip10RawIndex.hardened(118),
          Slip10RawIndex.hardened(0),
          Slip10RawIndex.normal(0),
          Slip10RawIndex.normal(0),
        ];
        const { privkey: privateKey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, path);

        // Sign the hash
        const signature = await Secp256k1.createSignature(messageHash, privateKey);
        const fixedSignature = new Uint8Array([...signature.r(32), ...signature.s(32)]);
        const pubKey = (await Secp256k1.makeKeypair(privateKey)).pubkey;

        // Create the final worker data bundle
        const workerDataBundle: InputWorkerDataBundle = {
          worker: senderAddress,
          nonce: { blockHeight: Number(blockHeightStr) },
          topicId: Number(topicId), // Convert to uint64 as per protocol
          inferenceForecastsBundle: bundle,
          inferencesForecastsBundleSignature: Buffer.from(fixedSignature),
          pubkey: Buffer.from(pubKey).toString('hex'),
        };

        // Validate the bundle before submission
        this.validateWorkerDataBundle(workerDataBundle);

        // Create an instance of the generated worker data bundle class
        const workerDataBundleProto = InputWorkerDataBundle.fromPartial(workerDataBundle);

        // Create the final message for blockchain submission using the generated Msg class
        const message: EncodeObject = {
          typeUrl: msgInsertWorkerPayloadTypeUrl,
          value: InsertWorkerPayloadRequest.fromPartial({
            sender: senderAddress,
            workerDataBundle: workerDataBundleProto,
          }),
        };

        const fee = {
          amount: [], // Fee calculated from gas limit and price
          gas: this.INFERENCE_GAS_LIMIT,
        };

        log.debug({ message, fee }, "Broadcasting worker payload transaction");
        const result = await client.signAndBroadcast(senderAddress, [message], fee, `Submitting worker payload for topic ${topicId}`);

        if (isDeliverTxFailure(result)) {
          // Log the specific reason the chain rejected the transaction, including the hash
          log.error(
            { rawLog: result.rawLog, txHash: result.transactionHash, code: result.code },
            'Transaction was broadcast but failed on-chain execution.'
          );
          throw new Error(`Transaction failed: ${result.rawLog}`);
        }

        log.info({ txHash: result.transactionHash, topicId }, 'Worker payload submission successful.');
        return { txHash: result.transactionHash };

      } catch (error) {
        log.error({
          err: error,
          attempt: i + 1,
          // Add any extra context available at this point
          signingAddress: senderAddress || 'unknown'
        }, `Attempt ${i + 1} to submit worker payload failed.`
        );
        if (i === this.MAX_RETRIES - 1) {
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    return null;
  }

  /**
   * Get the current block height using CLI text/YAML output.
   * Tries `--type=height` first, falls back to generic output parsing.
   */
  public async getCurrentBlockHeight(): Promise<number | null> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getCurrentBlockHeight' });

    const tryParse = (text: string | null): number | null => {
      if (!text) return null;
      // Prefer YAML header.height: "N"
      const m = text.match(/\bheight:\s*"(\d+)"/);
      if (m && m[1]) {
        const n = Number(m[1]);
        return Number.isFinite(n) ? n : null;
      }
      // Some nodes may print a simple number or other formats; attempt a generic digits grab
      const m2 = text.match(/\b(\d{3,})\b/);
      if (m2 && m2[1]) {
        const n2 = Number(m2[1]);
        if (Number.isFinite(n2)) return n2;
      }
      return null;
    };

    // 1) Preferred: `--type=height`
    const cmdHeight = `allorad query block --type=height`;
    const [out1] = await this.execAsyncWithRetry(cmdHeight);
    let parsed = tryParse(out1);

    // 2) Fallback: generic `block` parsing
    if (parsed == null) {
      const cmdFallback = `allorad query block`;
      const [out2] = await this.execAsyncWithRetry(cmdFallback);
      parsed = tryParse(out2);
    }

    if (parsed == null) {
      log.error({ out1 }, 'Failed to parse current block height from CLI output');
      return null;
    }

    log.info({ height: parsed }, 'Current block height');
    return parsed;
  }

  /**
   * Get topic timing information (epoch_length, worker_submission_window, epoch_last_ended)
   * Command: `allorad query emissions topic <topicId>` (YAML/text)
   */
  public async getTopicInfo(topicId: string): Promise<{ epochLength: number; workerSubmissionWindow: number; epochLastEnded: number } | null> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getTopicInfo', topicId });
    const command = `allorad query emissions topic ${topicId}`;
    const [stdout, error] = await this.execAsyncWithRetry(command);
    if (error || !stdout) {
      log.error({ err: error }, 'Failed to get topic info');
      return null;
    }
    try {
      const data = yaml.load(stdout) as any;
      const t = data?.topic ?? {};
      const epochLength = Number(t.epoch_length);
      const workerWindow = Number(t.worker_submission_window);
      const epochLastEnded = Number(t.epoch_last_ended);
      if (![epochLength, workerWindow, epochLastEnded].every(Number.isFinite)) {
        throw new Error('Missing or invalid numeric fields in topic');
      }
      log.info({ epochLength, workerWindow, epochLastEnded }, 'Parsed topic info');
      return { epochLength, workerSubmissionWindow: workerWindow, epochLastEnded };
    } catch (e) {
      log.error({ err: e, stdout }, 'Failed to parse topic YAML');
      return null;
    }
  }

  // isWorkerNonceUnfulfilled (CLI-based) removed in favor of API-based deriveLatestOpenWorkerNonce

  /**
   * Check whether a worker address can submit on a topic (whitelist/window check)
   */
  public async canSubmitWorker(topicId: string, workerAddress: string): Promise<boolean> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'canSubmitWorker', topicId, workerAddress });
    const command = `allorad query emissions can-submit-worker-payload ${topicId} ${workerAddress}`;
    const [stdout, error] = await this.execAsyncWithRetry(command);
    if (error || !stdout) {
      log.warn({ err: error }, 'can-submit-worker-payload failed; defaulting to true');
      return true; // graceful fallback
    }
    try {
      const data: any = yaml.load(stdout);
      const raw = (data?.can_submit_worker_payload ?? data?.can_submit ?? data?.value ?? data?.result);
      if (typeof raw === 'boolean') return raw;
      if (typeof raw === 'string') return raw.toLowerCase() === 'true';
      const m = String(stdout).match(/\b(true|false)\b/i);
      if (m) return m[1].toLowerCase() === 'true';
      return true;
    } catch (e) {
      const m = String(stdout).match(/\bcan_submit_worker_payload:\s*(true|false)\b/i) || String(stdout).match(/\b(true|false)\b/i);
      if (m) return m[1].toLowerCase() === 'true';
      log.warn({ err: e, stdout }, 'Failed to parse can-submit-worker-payload; defaulting to true');
      return true;
    }
  }

  /**
   * Derive the latest open worker nonce by scanning within the current submission window
   */
  public async deriveLatestOpenWorkerNonce(topicId: string): Promise<number | null> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'deriveLatestOpenWorkerNonce', topicId });
    const apiUrl = `https://allora-api.testnet.allora.network/emissions/v9/unfulfilled_worker_nonces/${topicId}`;

    try {
      log.info({ url: apiUrl }, 'Querying for unfulfilled worker nonces.');
      const response = await axios.get(apiUrl);

      // The response structure is nested, so we access it safely.
      const nonces = response.data?.nonces?.nonces;

      if (!nonces || !Array.isArray(nonces) || nonces.length === 0) {
        log.info({ topicId }, 'No unfulfilled worker nonces found for topic.');
        return null;
      }

      // Take the first available nonce from the list.
      const openNonce = nonces[0];
      const blockHeight = parseInt(openNonce.block_height, 10);

      if (isNaN(blockHeight)) {
        log.warn({ nonce: openNonce }, 'Found nonce but failed to parse block_height.');
        return null;
      }

      log.info({ chosenBlockHeight: blockHeight }, 'Found open worker nonce via direct API call.');
      return blockHeight;

    } catch (error: any) {
      // Check for a 404 error, which simply means no nonces exist.
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        log.info({ topicId }, 'Received 404, confirming no unfulfilled nonces.');
        return null;
      }
      log.error({ err: error, topicId }, 'Failed to fetch unfulfilled worker nonces.');
      return null;
    }
  }

  /**
   * Get all active topics from the Allora network that are available for contribution at the current block height
   */
  public async getActiveTopics(): Promise<{ topics: Array<{ id: string; metadata: string }> }> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getActiveTopics' });

    try {
      log.info('Fetching active topics from Allora network');

      const currentBlockHeight = await this.getCurrentBlockHeight();
      if (currentBlockHeight == null) {
        return { topics: [] };
      }

      // Get active topics at the current block height (only topics available for contribution)
      const activeTopicsCommand = `allorad query emissions active-topics-at-block ${currentBlockHeight}`;
      const [activeTopicsStdout, activeTopicsError] = await this.execAsyncWithRetry(activeTopicsCommand);

      if (activeTopicsError) {
        log.error({ err: activeTopicsError }, 'Failed to get active topics at current block height.');
        return { topics: [] };
      }

      // Parse the YAML output for active topics
      try {
        const activeTopicsData = yaml.load(activeTopicsStdout!) as any;
        const topics = activeTopicsData.topics || [];

        const formattedTopics = topics.map((topic: any) => ({
          id: String(topic.id),
          metadata: String(topic.metadata || `Topic ${topic.id}`)
        }));

        log.info({
          currentBlockHeight,
          activeTopicsCount: formattedTopics.length
        }, 'Successfully retrieved active topics available for contribution');

        return { topics: formattedTopics };

      } catch (parseError) {
        log.error({ err: parseError, activeTopicsStdout }, 'Failed to parse active topics response.');
        return { topics: [] };
      }

    } catch (error: any) {
      log.error({ err: error }, 'Failed to get active topics');
      return { topics: [] };
    }
  }
}

/**
 * Singleton instance of the AlloraConnectorService.
 */
const alloraConnectorService = new AlloraConnectorService();
export default alloraConnectorService; 
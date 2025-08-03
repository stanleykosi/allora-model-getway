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
import logger from '@/utils/logger';
import {
  AlloraBalance,
  TopicDetails,
  ExecResult,
  AlloraWorkerPerformance,
  AlloraEmaScore,
  InputInference,
  InputForecast,
  InputInferenceForecastBundle,
  InputForecastElement,
  WorkerResponsePayload,
  InputWorkerDataBundle
} from './allora-connector.types';

const execAsync = promisify(exec);

// Define the type URLs for our custom messages. These must match the definitions on the Allora chain.
const msgInsertInferenceTypeUrl = "/emissions.v1.MsgInsertInferences";
const msgInsertWorkerPayloadTypeUrl = "/emissions.v1.MsgInsertWorkerPayload";

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

    // Register our custom message types for inserting inferences and worker payloads.
    // NOTE: The protobuf encoding/decoding logic is simplified
    // here because the actual .proto files are not available. In a real-world scenario,
    // these would be generated from the chain's protobuf definitions.
    registry.register(msgInsertInferenceTypeUrl, {
      encode: (message: any, writer: any) => {
        // This is a simplified mock of protobuf encoding.
        const encoded = {
          sender: message.sender,
          inferences: message.inferences.map((inf: any) => ({
            topic_id: inf.topic_id,
            block_height: inf.block_height,
            value: inf.value
          }))
        };
        writer.writeString(JSON.stringify(encoded));
        return writer;
      },
      decode: (reader: any, length: any) => {
        const json = reader.readString(length);
        return JSON.parse(json);
      },
      fromPartial: (object: any) => object,
    });

    registry.register(msgInsertWorkerPayloadTypeUrl, {
      encode: (message: any, writer: any) => {
        // This is a simplified mock of protobuf encoding for worker payloads.
        writer.writeString(JSON.stringify(message));
        return writer;
      },
      decode: (reader: any, length: any) => {
        const json = reader.readString(length);
        return JSON.parse(json);
      },
      fromPartial: (object: any) => object,
    });
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
            ALLORA_RPC_URL: config.ALLORA_RPC_URL
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
    const getTopicCmd = `allorad query emissions topic ${topicId} --node ${config.ALLORA_RPC_URL}`;
    const [topicStdout, topicErr] = await this.execAsyncWithRetry(getTopicCmd);

    if (topicErr) {
      logger.error({ err: topicErr, topicId }, 'Failed to get topic details from chain.');
      return null;
    }

    const isActiveCmd = `allorad query emissions is-topic-active ${topicId} --output json --node ${config.ALLORA_RPC_URL}`;
    const [activeStdout, activeErr] = await this.execAsyncWithRetry(isActiveCmd);

    if (activeErr) {
      logger.error({ err: activeErr, topicId }, 'Failed to check if topic is active.');
      return null;
    }

    try {
      // Parse the isActive response (JSON)
      const isActiveData = JSON.parse(activeStdout!);
      const isActive = typeof isActiveData === 'boolean' ? isActiveData : isActiveData.is_active;

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
        const signingClient = await SigningStargateClient.connectWithSigner(config.ALLORA_RPC_URL, wallet, { gasPrice });

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
    let delay = this.INITIAL_DELAY_MS;

    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        log.info({ attempt: i + 1, topicId }, 'Attempting to submit inference.');

        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(signingMnemonic, { prefix: 'allo' });
        const [account] = await wallet.getAccounts();
        const senderAddress = account.address;

        const client = await SigningStargateClient.connectWithSigner(config.ALLORA_RPC_URL, wallet, {
          gasPrice: GasPrice.fromString(gasPrice),
        });

        const latestBlock = await client.getBlock();

        // Construct the custom message payload
        const msg = {
          sender: senderAddress,
          inferences: [{
            topic_id: topicId,
            block_height: latestBlock.header.height.toString(),
            value: inferenceData.value,
          }],
        };

        const message: EncodeObject = {
          typeUrl: msgInsertInferenceTypeUrl,
          value: msg,
        };

        const fee = {
          amount: [], // Fee is calculated from gas limit and price
          gas: this.INFERENCE_GAS_LIMIT,
        };

        log.debug({ message, fee }, "Broadcasting inference transaction");
        const result = await client.signAndBroadcast(senderAddress, [message], fee, `Submitting inference for topic ${topicId}`);

        if (isDeliverTxFailure(result)) {
          throw new Error(`Inference transaction failed: ${result.rawLog}`);
        }

        log.info({ txHash: result.transactionHash, topicId }, 'Inference submission successful.');
        return { txHash: result.transactionHash };

      } catch (error) {
        log.error({ err: error, attempt: i + 1 }, `Attempt ${i + 1} to submit inference failed.`);
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
   * Get latest network inferences for a topic
   */
  public async getLatestNetworkInferences(topicId: string): Promise<any> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getLatestNetworkInferences', topicId });

    try {
      log.info('Fetching latest network inferences from Allora network');

      const command = `allorad query emissions latest-network-inferences ${topicId} --node ${config.ALLORA_RPC_URL}`;
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

      const command = `allorad query emissions active-inferers ${topicId} --node ${config.ALLORA_RPC_URL}`;
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

      const command = `allorad query emissions active-forecasters ${topicId} --node ${config.ALLORA_RPC_URL}`;
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

      const command = `allorad query emissions active-reputers ${topicId} --node ${config.ALLORA_RPC_URL}`;
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
  public async submitWorkerPayload(
    signingMnemonic: string,
    topicId: string,
    workerResponse: WorkerResponsePayload,
    gasPrice: string
  ): Promise<{ txHash: string } | null> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'submitWorkerPayload', topicId });
    let delay = this.INITIAL_DELAY_MS;

    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        log.info({ attempt: i + 1, topicId }, 'Attempting to submit worker payload.');

        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(signingMnemonic, { prefix: 'allo' });
        const [account] = await wallet.getAccounts();
        const senderAddress = account.address;

        const client = await SigningStargateClient.connectWithSigner(config.ALLORA_RPC_URL, wallet, {
          gasPrice: GasPrice.fromString(gasPrice),
        });

        const latestBlock = await client.getBlock();
        const currentBlockHeight = latestBlock.header.height.toString();

        // Construct the inference payload
        const inference: InputInference = {
          topic_id: topicId,
          block_height: currentBlockHeight,
          inferer: senderAddress,
          value: workerResponse.inferenceValue,
        };

        // Construct the forecast payload if forecasts are provided
        let forecast: InputForecast | null = null;
        if (workerResponse.forecasts && workerResponse.forecasts.length > 0) {
          const forecastElements: InputForecastElement[] = workerResponse.forecasts.map(f => ({
            inferer: f.workerAddress,
            value: f.forecastedValue,
          }));

          forecast = {
            topic_id: topicId,
            block_height: currentBlockHeight,
            forecaster: senderAddress,
            forecast_elements: forecastElements,
          };
        }

        // Create the bundle
        const bundle: InputInferenceForecastBundle = {
          inference: inference,
          forecast: forecast,
        };

        // Sign the bundle
        const serializedBundle = stableStringify(bundle);
        const messageBytes = new TextEncoder().encode(serializedBundle);
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
          inference_forecasts_bundle: bundle,
          inference_forecasts_bundle_signature: Buffer.from(fixedSignature).toString('hex'),
          pubkey: Buffer.from(pubKey).toString('hex'),
        };

        // Create the message for blockchain submission
        const message: EncodeObject = {
          typeUrl: msgInsertWorkerPayloadTypeUrl,
          value: workerDataBundle,
        };

        const fee = {
          amount: [], // Fee calculated from gas limit and price
          gas: this.INFERENCE_GAS_LIMIT,
        };

        log.debug({ message, fee }, "Broadcasting worker payload transaction");
        const result = await client.signAndBroadcast(senderAddress, [message], fee, `Submitting worker payload for topic ${topicId}`);

        if (isDeliverTxFailure(result)) {
          throw new Error(`Worker payload transaction failed: ${result.rawLog}`);
        }

        log.info({ txHash: result.transactionHash, topicId }, 'Worker payload submission successful.');
        return { txHash: result.transactionHash };

      } catch (error) {
        log.error({ err: error, attempt: i + 1 }, `Attempt ${i + 1} to submit worker payload failed.`);
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
   * Get all active topics from the Allora network that are available for contribution at the current block height
   */
  public async getActiveTopics(): Promise<{ topics: Array<{ id: string; metadata: string }> }> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getActiveTopics' });

    try {
      log.info('Fetching active topics from Allora network');

      // Get the current block height
      const blockCommand = `allorad query block --node ${config.ALLORA_RPC_URL}`;
      const [blockStdout, blockError] = await this.execAsyncWithRetry(blockCommand);

      if (blockError) {
        log.error({ err: blockError }, 'Failed to get current block height.');
        return { topics: [] };
      }

      // Parse the current block height
      const blockMatch = blockStdout!.match(/height: "(\d+)"/);
      if (!blockMatch) {
        log.error('Failed to parse block height from output:', blockStdout);
        return { topics: [] };
      }

      const currentBlockHeight = parseInt(blockMatch[1]);
      log.info({ currentBlockHeight }, 'Found current block height');

      // Get active topics at the current block height (only topics available for contribution)
      const activeTopicsCommand = `allorad query emissions active-topics-at-block ${currentBlockHeight} --node ${config.ALLORA_RPC_URL}`;
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
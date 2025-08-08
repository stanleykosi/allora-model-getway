/**
 * @description
 * This service is the sole gateway for all interactions with the Allora blockchain.
 * It abstracts the complexities of the Allora network endpoints and CosmJS libraries,
 * providing a clean, Promise-based, and typed interface to the rest of the application.
 *
 * This service implements critical non-functional requirements:
 * - **Isolation:** No other part of the application can directly interact with
 *   the blockchain. This centralizes logic and simplifies maintenance.
 * - **Reliability:** All external calls are wrapped in a retry mechanism with
 *   exponential backoff to handle transient network or RPC node issues.
 *
 * @dependencies
 * - axios: To query API (LCD) endpoints directly.
 * - @cosmjs/stargate: For building, signing, and broadcasting transactions.
 * - @cosmjs/proto-signing: For wallet generation from mnemonics and handling custom messages.
 * - @/config: For accessing the Allora RPC URL and other chain configs.
 * - @/utils/logger: For structured logging of all operations.
 * - ./allora-connector.types: For typing the parsed JSON outputs.
 */

import axios, { AxiosInstance } from 'axios';
import {
  SigningStargateClient,
  GasPrice,
  Coin,
  DeliverTxResponse,
  isDeliverTxFailure,
  defaultRegistryTypes,
  calculateFee,
} from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, Registry, EncodeObject } from '@cosmjs/proto-signing';
import { Secp256k1, sha256 } from '@cosmjs/crypto';
import { EnglishMnemonic, Bip39, Slip10, Slip10Curve, Slip10RawIndex } from '@cosmjs/crypto';
// yaml no longer needed; all queries via API
import { config } from '@/config';
import { formatToBoundedExp40Dec } from './bounded-exp40dec';
import logger from '@/utils/logger';
import {
  AlloraBalance,
  TopicDetails,
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
import { processChainError, ChainErrorAction } from './chain-error.handler';

// Removed CLI execution; all queries use API and transactions use RPC

// Define the type URLs for our custom messages. These must match the definitions on the Allora chain.
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

  // Multi-node API/RPC management
  private readonly apiClient: AxiosInstance;
  private apiNodes: string[] = [];
  private rpcNodes: string[] = [];
  private currentApiNodeIndex = 0;
  private currentRpcNodeIndex = 0;

  // Cached chain minimum gas price (TTL-based)
  private cachedMinGasPrice: string | null = null;
  private cachedMinGasFetchedAt = 0;
  private readonly MIN_GAS_PRICE_CACHE_MS = 60_000; // 60s

  constructor() {
    // Create a new Registry instance, including all default Cosmos SDK message types
    const registry = new Registry();
    // Add default registry types
    Object.entries(defaultRegistryTypes).forEach(([key, value]) => {
      registry.register(key, value as any);
    });

    // Register v9 InsertWorkerPayloadRequest using generated encoder/decoder
    registry.register(msgInsertWorkerPayloadTypeUrl, InsertWorkerPayloadRequest as any);

    this.registry = registry;

    // Initialize multi-node config
    this.apiNodes = config.ALLORA_API_URLS.split(',').map((u) => u.trim().replace(/\/$/, ''));
    this.rpcNodes = config.ALLORA_RPC_URLS.split(',').map((u) => u.trim());
    if (this.apiNodes.length === 0 || this.rpcNodes.length === 0) {
      throw new Error('At least one API and one RPC node URL must be configured.');
    }

    // Initialize axios client
    this.apiClient = axios.create({
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    logger.info({ apiNodes: this.apiNodes, rpcNodes: this.rpcNodes }, 'AlloraConnectorService initialized with multi-node support and custom message types.');
  }


  // Removed CLI execution helper; retained for history in git

  // Node management helpers
  private getCurrentApiNode = (): string => this.apiNodes[this.currentApiNodeIndex];
  private getCurrentRpcNode = (): string => this.rpcNodes[this.currentRpcNodeIndex];

  private switchToNextApiNode = (): string => {
    this.currentApiNodeIndex = (this.currentApiNodeIndex + 1) % this.apiNodes.length;
    const newNode = this.getCurrentApiNode();
    logger.warn({ newNode }, 'Switched to next Allora API node due to a failure.');
    // Invalidate cached min gas price when switching nodes
    this.cachedMinGasPrice = null;
    this.cachedMinGasFetchedAt = 0;
    return newNode;
  };

  private switchToNextRpcNode = (): string => {
    this.currentRpcNodeIndex = (this.currentRpcNodeIndex + 1) % this.rpcNodes.length;
    const newNode = this.getCurrentRpcNode();
    logger.warn({ newNode }, 'Switched to next Allora RPC node due to a failure.');
    return newNode;
  };

  private async getEffectiveGasPrice(fallbackGasPrice: string): Promise<GasPrice> {
    const parse = (s: string) => {
      const m = String(s).trim().match(/^(\d*\.?\d+)([a-zA-Z/]+)$/);
      if (!m) return null as unknown as { amount: number; denom: string };
      return { amount: Number(m[1]), denom: m[2] } as { amount: number; denom: string };
    };

    // Use cached value if still fresh
    const now = Date.now();
    let chainMin: string | null = null;
    if (this.cachedMinGasPrice && now - this.cachedMinGasFetchedAt < this.MIN_GAS_PRICE_CACHE_MS) {
      chainMin = this.cachedMinGasPrice;
    } else {
      for (let i = 0; i < this.apiNodes.length; i++) {
        try {
          const apiUrl = this.getCurrentApiNode();
          const res = await this.apiClient.get(`${apiUrl}/cosmos/base/node/v1beta1/config`);
          const min = res.data?.minimum_gas_price || res.data?.min_gas_price || res.data?.config?.minimum_gas_price;
          if (typeof min === 'string' && min.length > 0) {
            chainMin = min.split(',')[0].trim();
            this.cachedMinGasPrice = chainMin;
            this.cachedMinGasFetchedAt = now;
            break;
          }
        } catch (_e) {
          this.switchToNextApiNode();
        }
      }
    }

    const fb = parse(fallbackGasPrice) || { amount: 0, denom: 'uallo' };
    const cm = chainMin ? parse(chainMin) : null;
    if (cm && cm.denom === fb.denom) {
      const amt = Math.max(cm.amount, fb.amount);
      return GasPrice.fromString(`${amt}${fb.denom}`);
    }
    // Prefer chain denom if present, else fallback
    if (cm) return GasPrice.fromString(`${Math.max(cm.amount, fb.amount)}${cm.denom}`);
    return GasPrice.fromString(fallbackGasPrice);
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
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getTopicDetails', topicId });
    for (let i = 0; i < this.apiNodes.length; i++) {
      try {
        const apiUrl = this.getCurrentApiNode();
        const topicResponse = await this.apiClient.get(`${apiUrl}/emissions/v9/topics/${topicId}`);
        const topicData = topicResponse.data?.topic;

        const activeResponse = await this.apiClient.get(`${apiUrl}/emissions/v9/is_topic_active/${topicId}`);
        const isActive = Boolean(activeResponse.data?.is_active ?? activeResponse.data?.active);

        if (!topicData) throw new Error('Missing topic data in response');

      return {
          id: String(topicData.id ?? topicData.topic_id ?? topicId),
          epochLength: parseInt(String(topicData.epoch_length ?? '0'), 10),
          workerSubmissionWindow: topicData.worker_submission_window ? parseInt(String(topicData.worker_submission_window), 10) : undefined,
          epochLastEnded: topicData.epoch_last_ended ? parseInt(String(topicData.epoch_last_ended), 10) : undefined,
          isActive,
          creator: String(topicData.creator ?? ''),
          metadata: String(topicData.metadata ?? ''),
        };
      } catch (error) {
        log.warn({ err: error, node: this.getCurrentApiNode(), topicId }, 'Failed to get topic details from node.');
        this.switchToNextApiNode();
      }
    }
    log.error({ topicId }, 'Failed to get topic details from all available API nodes.');
    return null;
  }

  /**
   * Fetches the uallo balance for a given wallet address.
   * @param address The Allora wallet address.
   * @returns A promise resolving to the balance as a number, or null on error.
   */
  public async getAccountBalance(address: string): Promise<number | null> {
    for (let i = 0; i < this.apiNodes.length; i++) {
      try {
        const apiUrl = this.getCurrentApiNode();
        const response = await this.apiClient.get(`${apiUrl}/cosmos/bank/v1beta1/balances/${address}`);
        const balances: AlloraBalance[] = response.data?.balances ?? [];
        const alloBalance = balances.find((b) => b.denom === 'uallo');
        return alloBalance ? parseInt(String(alloBalance.amount), 10) : 0;
      } catch (error) {
        logger.warn({ err: error, address, node: this.getCurrentApiNode() }, 'Failed to get account balance from node.');
        this.switchToNextApiNode();
      }
    }
    logger.error({ address }, 'Failed to get account balance from all API nodes');
      return null;
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

      let emaScoreData: AlloraEmaScore | null = null;
      for (let i = 0; i < this.apiNodes.length; i++) {
        try {
          const apiUrl = this.getCurrentApiNode();
          const res = await this.apiClient.get(`${apiUrl}/emissions/v9/inferer_score_ema/${topicId}/${workerAddress}`);
          emaScoreData = res.data as AlloraEmaScore;
          break;
        } catch (e) {
          this.switchToNextApiNode();
        }
      }
      if (!emaScoreData) return null;

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

        const signingClient = await SigningStargateClient.connectWithSigner(this.getCurrentRpcNode(), wallet, {
          registry: this.registry,
          gasPrice: await this.getEffectiveGasPrice(this.TREASURY_GAS_PRICE),
        });

        // Simulate to estimate gas
        let gasLimit = parseInt(this.UNIVERSAL_GAS_LIMIT, 10);
        try {
          const simulated = await signingClient.simulate(
            fromAccount.address,
            [
              {
                typeUrl: '/cosmos.bank.v1beta1.MsgSend',
                value: { fromAddress: fromAccount.address, toAddress, amount: [coinsToSend] },
              } as any,
            ],
            undefined
          );
          gasLimit = Math.ceil(Number(simulated) * 1.2);
        } catch (e) {
          log.warn({ err: e }, 'Simulation failed for transferFunds; using default gas limit');
        }

        const fee = calculateFee(gasLimit, await this.getEffectiveGasPrice(this.TREASURY_GAS_PRICE));

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
        log.warn({ err: error, attempt: i + 1 }, 'Transfer funds attempt failed');
        const decision = processChainError(error);
        if (decision.action === ChainErrorAction.Fail) return null;
        if (decision.action === ChainErrorAction.SwitchNode) this.switchToNextRpcNode();
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    return null;
  }

  // Legacy submitInference (v1) removed; use submitWorkerPayload (v9)

  /**
   * Get latest network inferences for a topic
   */
  public async getLatestNetworkInferences(topicId: string): Promise<any> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'getLatestNetworkInferences', topicId });

    try {
      log.info('Fetching latest network inferences from Allora network');

      let latestInferences: any = {};
      for (let i = 0; i < this.apiNodes.length; i++) {
        try {
          const apiUrl = this.getCurrentApiNode();
          const res = await this.apiClient.get(`${apiUrl}/emissions/v9/latest_network_inferences/${topicId}`);
          latestInferences = res.data;
          break;
        } catch (e) {
          this.switchToNextApiNode();
        }
      }

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

      let activeInferers: any = {};
      for (let i = 0; i < this.apiNodes.length; i++) {
        try {
          const apiUrl = this.getCurrentApiNode();
          const res = await this.apiClient.get(`${apiUrl}/emissions/v9/active_inferers/${topicId}`);
          activeInferers = res.data;
          break;
        } catch (e) {
          this.switchToNextApiNode();
        }
      }

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

      let activeForecasters: any = {};
      for (let i = 0; i < this.apiNodes.length; i++) {
        try {
          const apiUrl = this.getCurrentApiNode();
          const res = await this.apiClient.get(`${apiUrl}/emissions/v9/active_forecasters/${topicId}`);
          activeForecasters = res.data;
          break;
        } catch (e) {
          this.switchToNextApiNode();
        }
      }

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

      let activeReputers: any = {};
      for (let i = 0; i < this.apiNodes.length; i++) {
        try {
          const apiUrl = this.getCurrentApiNode();
          const res = await this.apiClient.get(`${apiUrl}/emissions/v9/active_reputers/${topicId}`);
          activeReputers = res.data;
          break;
        } catch (e) {
          this.switchToNextApiNode();
        }
      }

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

        const client = await SigningStargateClient.connectWithSigner(this.getCurrentRpcNode(), wallet, {
          registry: this.registry,
          gasPrice: await this.getEffectiveGasPrice(gasPrice),
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

        // Simulate via API to estimate gas, then compute dynamic fee
        let gasLimit = parseInt(this.INFERENCE_GAS_LIMIT, 10);
        try {
          const apiUrl = this.getCurrentApiNode();
          // Sign with dummy fee to get tx bytes
          const accountInfo = await client.getSequence(senderAddress);
          const anyMsgs = [message as any];
          const simulated = await client.simulate(senderAddress, anyMsgs, undefined);
          gasLimit = Math.ceil(Number(simulated) * 1.2);
        } catch (e) {
          log.warn({ err: e }, 'Simulation failed; falling back to default gas limit');
        }

        const fee = calculateFee(gasLimit, await this.getEffectiveGasPrice(gasPrice));

        log.debug({ message, fee }, 'Broadcasting worker payload transaction');
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
        log.warn({ err: error, attempt: i + 1, signingAddress: senderAddress || 'unknown' }, 'Submission attempt failed');
        const decision = processChainError(error);
        if (decision.action === ChainErrorAction.Fail) return null;
        if (decision.action === ChainErrorAction.SwitchNode) {
          this.switchToNextRpcNode();
          this.switchToNextApiNode();
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
    for (let i = 0; i < this.apiNodes.length; i++) {
      try {
        const apiUrl = this.getCurrentApiNode();
        const response = await this.apiClient.get(`${apiUrl}/cosmos/base/tendermint/v1beta1/blocks/latest`);
        const heightStr = response?.data?.block?.header?.height;
        const height = parseInt(String(heightStr), 10);
        if (!Number.isNaN(height)) {
          log.info({ height }, 'Successfully fetched current block height.');
          return height;
        }
      } catch (error) {
        log.warn({ err: error, node: this.getCurrentApiNode() }, 'Failed to get block height from node.');
        this.switchToNextApiNode();
      }
    }
    log.error('Failed to get current block height from all available API nodes.');
      return null;
    }

  // Topic timing information is available via getTopicDetails
  // isWorkerNonceUnfulfilled (CLI-based) removed in favor of API-based deriveLatestOpenWorkerNonce

  /**
   * Check whether a worker address can submit on a topic (whitelist/window check)
   */
  public async canSubmitWorker(topicId: string, workerAddress: string): Promise<boolean> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'canSubmitWorker', topicId, workerAddress });
    for (let i = 0; i < this.apiNodes.length; i++) {
      try {
        const apiUrl = this.getCurrentApiNode();
        const response = await this.apiClient.get(`${apiUrl}/emissions/v9/can_submit_worker_payload/${topicId}/${workerAddress}`);
        const raw = response.data?.can_submit_worker_payload ?? response.data?.can_submit ?? response.data?.is_allowed ?? response.data?.value;
      if (typeof raw === 'boolean') return raw;
      if (typeof raw === 'string') return raw.toLowerCase() === 'true';
        return Boolean(raw);
    } catch (e) {
        log.warn({ err: e }, 'canSubmitWorker failed on node; switching');
        this.switchToNextApiNode();
      }
    }
    log.warn('canSubmitWorker failed on all nodes; defaulting to true');
    return true;
  }

  /**
   * Derive the latest open worker nonce by scanning within the current submission window
   */
  public async deriveLatestOpenWorkerNonce(topicId: string): Promise<number | null> {
    const log = logger.child({ service: 'AlloraConnectorService', method: 'deriveLatestOpenWorkerNonce', topicId });
    try {
      for (let i = 0; i < this.apiNodes.length; i++) {
        const apiUrl = `${this.getCurrentApiNode()}/emissions/v9/unfulfilled_worker_nonces/${topicId}`;
      log.info({ url: apiUrl }, 'Querying for unfulfilled worker nonces.');
        try {
          const response = await this.apiClient.get(apiUrl);
      // The response structure is nested, so we access it safely.
      const nonces = response.data?.nonces?.nonces;
          return null;
      if (!nonces || !Array.isArray(nonces) || nonces.length === 0) {
        log.info({ topicId }, 'No unfulfilled worker nonces found for topic.');
        return null;
      }

      // Take the first available nonce from the list.
      const openNonce = nonces[0];
          const blockHeight = parseInt(String(openNonce.block_height), 10);

      if (isNaN(blockHeight)) {
        log.warn({ nonce: openNonce }, 'Found nonce but failed to parse block_height.');
        return null;
      }

      log.info({ chosenBlockHeight: blockHeight }, 'Found open worker nonce via direct API call.');
      return blockHeight;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        log.info({ topicId }, 'Received 404, confirming no unfulfilled nonces.');
        return null;
      }
          log.warn({ err: error, node: this.getCurrentApiNode() }, 'Failed to fetch unfulfilled worker nonces; switching node.');
          this.switchToNextApiNode();
        }
      }
      // Exhausted all nodes without a conclusive result
      return null;
    } catch (error: any) {
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
      let formattedTopics: Array<{ id: string; metadata: string }> = [];
      for (let i = 0; i < this.apiNodes.length; i++) {
        try {
          const apiUrl = this.getCurrentApiNode();
          const res = await this.apiClient.get(`${apiUrl}/emissions/v9/active_topics_at_block/${currentBlockHeight}`);
          const topics = res.data?.topics ?? [];
          formattedTopics = topics.map((topic: any) => ({
            id: String(topic.id ?? topic.topic_id),
            metadata: String(topic.metadata ?? `Topic ${topic.id}`),
          }));
          log.info({ currentBlockHeight, activeTopicsCount: formattedTopics.length }, 'Successfully retrieved active topics available for contribution');
          break;
        } catch (e) {
          this.switchToNextApiNode();
        }
      }
        return { topics: formattedTopics };

    } catch (error: any) {
      log.error({ err: error }, 'Failed to get active topics');
      return { topics: [] };
    }
  }

  public async performStartupHealthCheck(): Promise<void> {
    logger.info('Performing startup health check for Allora API node...');
    try {
      const apiUrl = this.getCurrentApiNode();
      await this.apiClient.get(`${apiUrl}/cosmos/base/tendermint/v1beta1/node_info`);
      logger.info({ node: apiUrl }, 'Node is reachable.');

      const syncResponse = await this.apiClient.get(`${apiUrl}/cosmos/base/tendermint/v1beta1/syncing`);
      if (syncResponse.data?.syncing === true) {
        logger.warn({ node: apiUrl }, 'WARNING: Node is still syncing. Data may be outdated.');
      } else {
        logger.info({ node: apiUrl }, 'Node is fully synced.');
      }
    } catch (error) {
      logger.fatal({ err: error, node: this.getCurrentApiNode() }, 'CRITICAL: Could not connect to the initial Allora API node. Please check your ALLORA_API_URLS configuration.');
      // Do not throw; allow app to continue and other nodes to be tried at runtime
    }
  }
}

/**
 * Singleton instance of the AlloraConnectorService.
 */
const alloraConnectorService = new AlloraConnectorService();
export default alloraConnectorService; 
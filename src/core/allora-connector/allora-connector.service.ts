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
import { config } from '@/config';
import logger from '@/utils/logger';
import {
  AlloraTopic,
  AlloraBalance,
  TopicDetails,
  ExecResult,
  InferenceData,
  MsgInsertInference,
  AlloraWorkerPerformance,
  AlloraEmaScore
} from './allora-connector.types';

const execAsync = promisify(exec);

// Define the type URL for our custom message. This must match the definition on the Allora chain.
const msgInsertInferenceTypeUrl = "/emissions.v1.MsgInsertInferences";

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

    // Register our custom message type for inserting inferences.
    // NOTE: The protobuf encoding/decoding logic for `MsgInsertInference` is simplified
    // here because the actual .proto files are not available. In a real-world scenario,
    // these would be generated from the chain's protobuf definitions.
    registry.register(msgInsertInferenceTypeUrl, {
      encode: (message: MsgInsertInference, writer: any) => {
        // This is a simplified mock of protobuf encoding.
        const encoded = {
          sender: message.sender,
          inferences: message.inferences.map(inf => ({
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
          { err: error, attempt: i + 1, command },
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

    const isActiveCmd = `allorad query emissions is-topic-active ${topicId} --output json`;
    const [activeStdout, activeErr] = await this.execAsyncWithRetry(isActiveCmd);

    if (activeErr) {
      logger.error({ err: activeErr, topicId }, 'Failed to check if topic is active.');
      return null;
    }

    try {
      // Parse the isActive response (JSON)
      const isActiveData = JSON.parse(activeStdout!);
      const isActive = typeof isActiveData === 'boolean' ? isActiveData : isActiveData.is_active;

      // Parse the topic response (YAML-like format)
      // The topic command returns YAML format, so we need to parse it manually
      const topicLines = topicStdout!.split('\n');
      let topicId = '';
      let epochLength = 0;
      let creator = '';
      let inTopicSection = false;

      for (const line of topicLines) {
        if (line.includes('topic:')) {
          inTopicSection = true;
          continue;
        }

        if (inTopicSection) {
          if (line.includes('id:')) {
            topicId = line.split('id:')[1].trim().replace(/"/g, '');
          } else if (line.includes('epoch_length:')) {
            epochLength = parseInt(line.split('epoch_length:')[1].trim().replace(/"/g, ''), 10);
          } else if (line.includes('creator:')) {
            creator = line.split('creator:')[1].trim();
          }
        }
      }

      logger.debug({ topicId, epochLength, creator, isActive, topicStdout }, 'Parsed topic details');

      if (!topicId || !epochLength || !creator) {
        logger.warn({ topicId: topicId, epochLength, creator, output: topicStdout }, 'Topic data incomplete in chain response.');
        return null;
      }

      return {
        id: topicId,
        epochLength: epochLength,
        isActive: isActive,
        creator: creator,
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
    const command = `allorad query bank balances ${address} --output json`;
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

    // Fetches the Exponential Moving Average score for the worker.
    const getEmaScoreCmd = `allorad query emissions inferer-score-ema ${topicId} ${workerAddress}`;
    const [emaScoreStdout, emaScoreErr] = await this.execAsyncWithRetry(getEmaScoreCmd);

    if (emaScoreErr) {
      log.error({ err: emaScoreErr }, 'Failed to get worker EMA score from chain.');
      return null;
    }

    try {
      // Parse YAML-like output
      const lines = emaScoreStdout!.split('\n');
      let score = '0';

      for (const line of lines) {
        if (line.includes('score:')) {
          const scoreMatch = line.match(/score:\s*"([^"]+)"/);
          if (scoreMatch) {
            score = scoreMatch[1];
            break;
          }
        }
      }

      log.debug({ score, output: emaScoreStdout }, 'Parsed EMA score from chain response.');
      return {
        emaScore: score,
      };
    } catch (parseError) {
      log.error({ err: parseError, output: emaScoreStdout }, 'Failed to parse EMA score output.');
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
    inferenceData: InferenceData,
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
        const msg: MsgInsertInference = {
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
}

/**
 * Singleton instance of the AlloraConnectorService.
 */
const alloraConnectorService = new AlloraConnectorService();
export default alloraConnectorService; 
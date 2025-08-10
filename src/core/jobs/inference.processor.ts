/**
 * @description
 * This file contains the processor for handling jobs from the 'inference-submission'
 * queue. The processor is the core of the asynchronous workflow, responsible for
 * fetching a prediction from a model's webhook and submitting it to the
 * Allora blockchain.
 *
 * @dependencies
 * - axios: For making HTTP requests to the model's webhook.
 * - bullmq: For the Job type definition.
 * - @/utils/logger: For structured logging.
 * - @/persistence/postgres.client: For database access.
 * - @/core/secrets/secrets.service: For retrieving wallet mnemonics.
 * - @/core/allora-connector/allora-connector.service: For submitting the transaction.
 */

import axios from 'axios';
import { Job } from 'bullmq';
import logger from '@/utils/logger';
import { config } from '@/config';
import pool from '@/persistence/postgres.client';
import secretsService from '@/core/secrets/secrets.service';
import alloraConnectorService from '@/core/allora-connector/allora-connector.service';
import { submissionSuccess, submissionFailure } from '@/metrics/metrics';

// Simple in-memory per-topic lock to serialize submissions per topic
const topicLocks = new Map<string, Promise<void>>();
const runWithTopicLock = async (topicId: string, fn: () => Promise<void>): Promise<void> => {
  const key = String(topicId);
  const prev = topicLocks.get(key) || Promise.resolve();
  let resolver: () => void;
  const next = new Promise<void>((r) => (resolver = r!));
  topicLocks.set(key, prev.then(() => next));
  try {
    await prev; // wait previous chain
    await fn();
  } finally {
    resolver!();
    if (topicLocks.get(key) === next) {
      topicLocks.delete(key);
    }
  }
};
import { WorkerResponsePayload } from '../allora-connector/allora-connector.types';

const DEFAULT_GAS_PRICE = '10uallo';

export interface InferenceJobData {
  modelId: string;
  webhookUrl: string;
  topicId: string;
}

interface ModelAndWallet {
  walletId: string;
  secretRef: string;
  maxGasPrice?: string;
}

/**
 * @param webhookUrl The URL to call.
 * @param activeWorkers Addresses of other workers on the topic.
 * @returns A promise resolving to the new WorkerResponsePayload.
 */
const getInferenceFromWebhook = async (webhookUrl: string, activeWorkers: string[]): Promise<WorkerResponsePayload> => {
  const log = logger.child({ method: 'getInferenceFromWebhook', webhookUrl });
  try {
    // The webhook is now sent the list of active workers to forecast against
    const response = await axios.post<WorkerResponsePayload>(
      webhookUrl,
      { activeWorkers },
      { timeout: 10000 } // 10-second timeout
    );

    if (response.status !== 200) {
      throw new Error(`Webhook returned status ${response.status}`);
    }

    // Check if we have any data to submit
    const data = response.data;
    if (!data.inferenceValue && (!data.forecasts || data.forecasts.length === 0)) {
      throw new Error('Webhook must provide either inferenceValue or forecasts');
    }

    // Validate optional protocol fields if provided
    if (data.extraData && typeof data.extraData !== 'string') {
      throw new Error('extraData must be a base64-encoded string');
    }
    if (data.proof && typeof data.proof !== 'string') {
      throw new Error('proof must be a string');
    }
    if (data.forecastExtraData && typeof data.forecastExtraData !== 'string') {
      throw new Error('forecastExtraData must be a base64-encoded string');
    }

    // Convert base64 strings to Uint8Array for protocol compliance
    const processedData: WorkerResponsePayload = {
      inferenceValue: data.inferenceValue,
      forecasts: data.forecasts,
      extraData: data.extraData ? Buffer.from(data.extraData, 'base64') : undefined,
      proof: data.proof,
      forecastExtraData: data.forecastExtraData ? Buffer.from(data.forecastExtraData, 'base64') : undefined,
    };

    log.info({
      hasForecasts: !!data.forecasts,
      hasExtraData: !!data.extraData,
      hasProof: !!data.proof,
      hasForecastExtraData: !!data.forecastExtraData
    }, 'Successfully received payload from webhook.');

    return processedData;
  } catch (error) {
    log.error({ err: error }, 'Failed to get inference from model webhook.');
    throw error;
  }
};

const getModelAndWalletDetails = async (modelId: string): Promise<ModelAndWallet> => {
  const query = `
      SELECT
        m.wallet_id as "walletId",
        w.secret_ref as "secretRef",
        m.max_gas_price as "maxGasPrice"
      FROM models m
      JOIN wallets w ON m.wallet_id = w.id
      WHERE m.id = $1;
    `;
  const result = await pool.query<ModelAndWallet>(query, [modelId]);
  if (result.rows.length === 0) {
    throw new Error(`No model found with ID: ${modelId}`);
  }
  return result.rows[0];
};

/**
 * @function inferenceProcessor
 * @description The main function for processing an inference job under the new V2 standard.
 */
const inferenceProcessor = async (job: Job<InferenceJobData>): Promise<void> => {
  const { modelId, webhookUrl, topicId } = job.data;
  const log = logger.child({ module: 'InferenceProcessorV2', jobId: job.id, modelId, topicId });

  log.info('Starting processing of V2 inference job.');

  await runWithTopicLock(String(topicId), async () => {
    try {
      // 1. Get active inferers on the topic for forecasting purposes.
      const activeWorkerAddresses = await alloraConnectorService.getActiveInferers(topicId);
      log.info({ count: activeWorkerAddresses.length }, 'Fetched active workers for topic.');

      // 2. Fetch the inference and forecasts from the model's webhook.
      const workerResponse = await getInferenceFromWebhook(webhookUrl, activeWorkerAddresses);

      // 3. Retrieve model and wallet details from the database.
      const details = await getModelAndWalletDetails(modelId);
      log.info({ walletId: details.walletId }, 'Retrieved model and wallet details.');

      // 4. Securely retrieve the wallet's mnemonic.
      const mnemonic = await secretsService.getSecret(details.secretRef);
      if (!mnemonic) {
        throw new Error(`Mnemonic not found for secret ref: ${details.secretRef}`);
      }
      log.info('Retrieved wallet mnemonic securely.');

      // 4.1 Gate by topic window and nonce before submitting
      const topicDetails = await alloraConnectorService.getTopicDetails(String(topicId));
      const currentHeight = await alloraConnectorService.getCurrentBlockHeight();
      if (!topicDetails || currentHeight == null || topicDetails.epochLastEnded == null || topicDetails.workerSubmissionWindow == null) {
        log.info({ topicDetails, currentHeight }, 'Skipping submission: missing topic details or current height');
        return; // Skip this run; scheduler will try later
      }
      const windowStart = topicDetails.epochLastEnded + 1;
      const windowEnd = topicDetails.epochLastEnded + topicDetails.workerSubmissionWindow;
      const inWindow = currentHeight >= windowStart && currentHeight <= windowEnd;
      log.info({ currentHeight, windowStart, windowEnd, inWindow }, 'Worker submission window check');
      if (!inWindow) {
        log.info('Not in worker submission window; skipping this attempt');
        return;
      }

      // Optional whitelist/window check
      if (!config.JOBS_BYPASS_CAN_SUBMIT) {
        const can = await alloraConnectorService.canSubmitWorker(String(topicId), details.walletId /* placeholder */ as any);
        log.info({ can }, 'canSubmitWorker check (note: address is validated in submit path)');
        // We won’t hard fail here because submit path validates actual sender; this is for visibility.
      }

      const nonceHeight = await alloraConnectorService.deriveLatestOpenWorkerNonce(String(topicId));
      log.info({ nonceHeight }, 'Derived latest open worker nonce');
      if (nonceHeight == null) {
        log.info('No open nonce found in current window; skipping');
        return;
      }

      // 5. Optional preflight balance check and auto top-up
      if (config.ENABLE_PREFLIGHT_BALANCE_CHECK) {
        const addressRes = await pool.query<{ address: string }>('SELECT address FROM wallets WHERE id = $1', [details.walletId]);
        const modelAddress = addressRes.rows[0]?.address;
        if (modelAddress) {
          const balance = await alloraConnectorService.getAccountBalance(modelAddress);
          if (balance != null && balance < config.MIN_WALLET_BALANCE_UALLO) {
            log.info({ balance, address: modelAddress }, 'Preflight: low balance detected; attempting top-up');
            const treasuryMnemonic = await secretsService.getSecret(config.TREASURY_MNEMONIC_SECRET_KEY);
            if (treasuryMnemonic) {
              const amount = `${config.TOPUP_AMOUNT_UALLO}uallo`;
              const topup = await alloraConnectorService.transferFunds(treasuryMnemonic, modelAddress, amount);
              if (topup) log.info({ txHash: topup.txHash }, 'Top-up successful');
              else log.warn('Top-up failed');
            } else {
              log.warn('Preflight: treasury mnemonic not available; skipping top-up');
            }
          }
        }
      }

      // 6. Submit the new, comprehensive payload to the blockchain.
      const gasPrice = details.maxGasPrice || DEFAULT_GAS_PRICE;
      const fastBroadcast = !!config.JOBS_FAST_BROADCAST;
      const submissionResult = await alloraConnectorService.submitWorkerPayload(
        mnemonic,
        topicId,
        workerResponse,
        gasPrice,
        nonceHeight,
        fastBroadcast ? { fastBroadcast: true, fixedGasLimit: config.SUBMISSION_FIXED_GAS_LIMIT } : undefined
      );

      if (!submissionResult) {
        // Persist failure attempt
        await pool.query(
          'INSERT INTO submissions (model_id, topic_id, nonce_height, status, raw_log) VALUES ($1, $2, $3, $4, $5)',
          [modelId, topicId, nonceHeight, 'failed', 'submitWorkerPayload returned null']
        );
        throw new Error('Failed to submit worker payload to the blockchain after all retries.');
      }

      // Persist success attempt
      await pool.query(
        'INSERT INTO submissions (model_id, topic_id, nonce_height, tx_hash, status) VALUES ($1, $2, $3, $4, $5)',
        [modelId, topicId, nonceHeight, submissionResult.txHash, 'success']
      );
      try { submissionSuccess.inc({ topicId }); } catch (_e) { }

      log.info({ txHash: submissionResult.txHash, nonceHeight }, 'Worker payload successfully submitted to the chain.');
    } catch (error) {
      // Persist failure with error details
      try {
        await pool.query(
          'INSERT INTO submissions (model_id, topic_id, status, raw_log) VALUES ($1, $2, $3, $4)',
          [modelId, topicId, 'failed', String((error as any)?.message || error)]
        );
      } catch (_e) { }
      try { submissionFailure.inc({ topicId, reason: 'exception' }); } catch (_e) { }
      log.error({ err: error }, 'An error occurred during V2 inference job processing.');
      throw error;
    }
  });
};

export default inferenceProcessor; 
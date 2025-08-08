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
import pool from '@/persistence/postgres.client';
import secretsService from '@/core/secrets/secrets.service';
import alloraConnectorService from '@/core/allora-connector/allora-connector.service';
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

  try {
    // 1. Get active inferers on the topic for forecasting purposes.
    const activeInferers = await alloraConnectorService.getActiveInferers(topicId);
    const activeWorkerAddresses = Object.keys(activeInferers || {});
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

    const nonceHeight = await alloraConnectorService.deriveLatestOpenWorkerNonce(String(topicId));
    log.info({ nonceHeight }, 'Derived latest open worker nonce');
    if (nonceHeight == null) {
      log.info('No open nonce found in current window; skipping');
      return;
    }

    // 5. Submit the new, comprehensive payload to the blockchain.
    const gasPrice = details.maxGasPrice || DEFAULT_GAS_PRICE;
    const submissionResult = await alloraConnectorService.submitWorkerPayload(
      mnemonic,
      topicId,
      workerResponse,
      gasPrice,
      nonceHeight
    );

    if (!submissionResult) {
      throw new Error('Failed to submit worker payload to the blockchain after all retries.');
    }

    log.info({ txHash: submissionResult.txHash, nonceHeight }, 'Worker payload successfully submitted to the chain.');
  } catch (error) {
    log.error({ err: error }, 'An error occurred during V2 inference job processing.');
    throw error;
  }
};

export default inferenceProcessor; 
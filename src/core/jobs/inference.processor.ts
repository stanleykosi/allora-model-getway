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
import { InferenceData } from '../allora-connector/allora-connector.types';

// The default gas price to use if a model does not have one specified.
const DEFAULT_GAS_PRICE = '10uallo';

/**
 * @interface InferenceJobData
 * @description Defines the structure of the data expected in an inference job.
 */
export interface InferenceJobData {
  modelId: string;
  webhookUrl: string;
  topicId: string;
}

/**
 * @interface ModelAndWallet
 * @description Defines the structure of the data returned from the database query.
 */
interface ModelAndWallet {
  walletId: string;
  secretRef: string;
  maxGasPrice?: string;
}

/**
 * Fetches the prediction from the data scientist's model webhook.
 * Implements a simple retry mechanism.
 * @param webhookUrl The URL to call.
 * @returns A promise resolving to the inference data.
 */
const getInferenceFromWebhook = async (webhookUrl: string): Promise<InferenceData> => {
  const log = logger.child({ method: 'getInferenceFromWebhook', webhookUrl });
  try {
    const response = await axios.post<InferenceData>(
      webhookUrl,
      {},
      { timeout: 10000 } // 10-second timeout
    );
    if (response.status !== 200 || !response.data.value) {
        throw new Error(`Webhook returned status ${response.status} or invalid data.`);
    }
    log.info({ responseData: response.data }, 'Successfully received inference from webhook.');
    return response.data;
  } catch (error) {
    log.error({ err: error }, 'Failed to get inference from model webhook.');
    throw error;
  }
};

/**
 * Retrieves the necessary model and wallet details from the database.
 * @param modelId The ID of the model.
 * @returns A promise resolving to the combined model and wallet data.
 */
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
 * @description The main function for processing an inference job.
 * @param job The BullMQ job object containing the payload.
 */
const inferenceProcessor = async (job: Job<InferenceJobData>): Promise<void> => {
  const { modelId, webhookUrl, topicId } = job.data;
  const log = logger.child({ module: 'InferenceProcessor', jobId: job.id, modelId, topicId });

  log.info('Starting processing of inference job.');

  try {
    // 1. Fetch the inference prediction from the model's webhook.
    const inferenceData = await getInferenceFromWebhook(webhookUrl);

    // 2. Retrieve model and wallet details from the database.
    const details = await getModelAndWalletDetails(modelId);
    log.info({ walletId: details.walletId }, 'Retrieved model and wallet details.');

    // 3. Securely retrieve the wallet's mnemonic from the secrets service.
    const mnemonic = await secretsService.getSecret(details.secretRef);
    if (!mnemonic) {
      throw new Error(`Mnemonic not found for secret ref: ${details.secretRef}`);
    }
    log.info('Retrieved wallet mnemonic securely.');

    // 4. Submit the inference to the Allora blockchain.
    const gasPrice = details.maxGasPrice || DEFAULT_GAS_PRICE;
    const submissionResult = await alloraConnectorService.submitInference(
      mnemonic,
      topicId,
      inferenceData,
      gasPrice
    );

    if (!submissionResult) {
      throw new Error('Failed to submit inference to the blockchain after all retries.');
    }

    log.info({ txHash: submissionResult.txHash }, 'Inference successfully submitted to the chain.');
  } catch (error) {
    log.error({ err: error }, 'An error occurred during inference job processing.');
    // Re-throw the error to let BullMQ handle the job failure and retry.
    throw error;
  }
};

export default inferenceProcessor; 
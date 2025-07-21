/**
 * @description
 * This service orchestrates the entire model registration workflow. It acts as
 * the central business logic layer for onboarding, coordinating with various other
 * services to validate data, create on-chain assets, manage secrets, and
 * persist state to the database.
 *
 * @dependencies
 * - @/config: For accessing configuration like treasury keys and funding amounts.
 * - @/utils/logger: For structured logging of the registration process.
 * - @/persistence/postgres.client: For database interactions.
 * - @/core/allora-connector/allora-connector.service: For all blockchain interactions.
 * - @/core/secrets/secrets.service: For handling secure credentials.
 * - ./wallet.service: For creating and managing model wallets.
 */

import { config } from '@/config';
import logger from '@/utils/logger';
import pool from '@/persistence/postgres.client';
import alloraConnectorService from '@/core/allora-connector/allora-connector.service';
import secretsService from '@/core/secrets/secrets.service';
import walletService, { CreatedWallet } from './wallet.service';

// --- Type Definitions ---

/**
 * @interface ModelRegistrationData
 * @description Defines the input data required to register a new model.
 */
export interface ModelRegistrationData {
  userId: string;
  webhookUrl: string;
  topicId: string;
  modelType: 'inference' | 'forecaster';
  maxGasPrice?: string;
}

/**
 * @interface RegistrationResult
 * @description Defines the successful output of the model registration process.
 */
export interface RegistrationResult {
  modelId: string;
  walletAddress: string;
  costsIncurred: {
    registrationFee: string;
    initialFunding: string;
    total: string;
  };
}

// --- Constants ---
// These values should be moved to a more formal configuration system
// or fetched from the chain if possible in a future iteration.
const REGISTRATION_FEE = 1000; // in uallo
const INITIAL_FUNDING = 50000; // in uallo
const TOTAL_FUNDING = REGISTRATION_FEE + INITIAL_FUNDING;

class ModelService {
  /**
   * Orchestrates the complete model registration workflow.
   *
   * @param data The model registration data.
   * @returns A promise resolving to the registration result or null on failure.
   */
  public async registerModel(data: ModelRegistrationData): Promise<RegistrationResult | null> {
    const log = logger.child({
      service: 'ModelService',
      method: 'registerModel',
      userId: data.userId,
      topicId: data.topicId,
    });

    log.info('Starting model registration process.');

    // Step 1: Validate the topic exists and is active on the Allora chain.
    const topicDetails = await alloraConnectorService.getTopicDetails(data.topicId);
    if (!topicDetails || !topicDetails.isActive) {
      log.warn('Registration failed: Topic is not active or does not exist.');
      throw new Error('Topic not found or is not active.');
    }
    log.info('Topic validation successful.');

    // Step 2: Create a new isolated wallet for the model.
    const newWallet = await walletService.createWallet();
    if (!newWallet) {
      log.error('Registration failed: Wallet creation failed.');
      throw new Error('Could not create a wallet for the model.');
    }
    log.info({ walletId: newWallet.id, address: newWallet.address }, 'Wallet created successfully.');

    // Step 3: Fund the newly created wallet from the central treasury.
    // This is a critical step that involves multiple failure points.
    const fundingSuccessful = await this.fundNewWallet(newWallet);
    if (!fundingSuccessful) {
      log.error({ walletId: newWallet.id }, 'Registration failed: Funding transaction failed. Rolling back wallet creation.');
      // If funding fails, we must clean up the wallet and its secret.
      await this.cleanupFailedRegistration(newWallet);
      throw new Error('Failed to fund the new model wallet. Please try again later.');
    }
    log.info({ walletAddress: newWallet.address }, 'Wallet funded successfully.');

    // Step 4: Persist the model's metadata to the database.
    try {
      const modelQuery = `
        INSERT INTO models (user_id, wallet_id, webhook_url, topic_id, model_type, max_gas_price)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
      `;
      const modelValues = [
        data.userId,
        newWallet.id,
        data.webhookUrl,
        data.topicId,
        data.modelType,
        data.maxGasPrice,
      ];
      const result = await pool.query<{ id: string }>(modelQuery, modelValues);
      const newModelId = result.rows[0]?.id;

      if (!newModelId) {
        // This is a critical failure state requiring manual intervention.
        // The wallet was created and funded, but the model record failed.
        log.fatal({ walletAddress: newWallet.address, userId: data.userId }, 'CRITICAL: Model DB insertion failed AFTER wallet was funded. Manual cleanup required.');
        throw new Error('A critical error occurred while saving the model.');
      }

      log.info({ modelId: newModelId }, 'Model successfully registered and saved to database.');

      // Step 5: Return the successful registration details.
      return {
        modelId: newModelId,
        walletAddress: newWallet.address,
        costsIncurred: {
          registrationFee: `${REGISTRATION_FEE}uallo`,
          initialFunding: `${INITIAL_FUNDING}uallo`,
          total: `${TOTAL_FUNDING}uallo`,
        },
      };
    } catch (dbError) {
      log.error({ err: dbError }, 'Error persisting model to database.');
      // As noted above, if this fails after funding, it's a critical issue.
      throw new Error('Failed to save model data.');
    }
  }

  /**
   * Handles the logic for funding a new wallet from the treasury.
   * @param newWallet The wallet to be funded.
   * @returns True if funding was successful, false otherwise.
   */
  private async fundNewWallet(newWallet: CreatedWallet): Promise<boolean> {
    const treasuryMnemonic = await secretsService.getSecret(config.TREASURY_MNEMONIC_SECRET_KEY);
    if (!treasuryMnemonic) {
      logger.fatal('CRITICAL: Treasury wallet mnemonic is not available in secrets manager.');
      // Cannot proceed without the treasury mnemonic.
      return false;
    }

    const amountToSend = `${TOTAL_FUNDING}uallo`;
    const transferResult = await alloraConnectorService.transferFunds(
      treasuryMnemonic,
      newWallet.address,
      amountToSend
    );

    return transferResult !== null;
  }

  /**
   * Cleans up resources created during a failed registration attempt.
   * @param wallet The wallet that was created.
   */
  private async cleanupFailedRegistration(wallet: CreatedWallet): Promise<void> {
    try {
      // Delete the secret first.
      await secretsService.deleteSecret(wallet.secretRef);
      // Then delete the database record.
      await pool.query('DELETE FROM wallets WHERE id = $1', [wallet.id]);
      logger.info({ walletId: wallet.id, secretRef: wallet.secretRef }, 'Successfully cleaned up resources from failed registration.');
    } catch (cleanupError) {
      logger.fatal({ err: cleanupError, walletId: wallet.id }, 'CRITICAL: Failed to cleanup resources after a failed registration. Manual intervention required.');
    }
  }
}


/**
 * Singleton instance of the ModelService.
 */
const modelService = new ModelService();
export default modelService; 
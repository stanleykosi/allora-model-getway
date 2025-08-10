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
  isInferer: boolean;
  isForecaster: boolean;
  maxGasPrice?: string;
}

/**
 * @interface RegistrationResult
 * @description Defines the successful output of the model registration process.
 */
export interface RegistrationResult {
  modelId: string;
  walletAddress: string;
  registrationTxHash?: string;
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
    // 3.1 Simulate registration to estimate fee, then apply multiplier
    // Try 1) chain param registration_fee; 2) simulate; 3) conservative fallback
    let baseFeeUallo: number | null = await alloraConnectorService.getRegistrationFeeUallo();
    if (baseFeeUallo == null) {
      baseFeeUallo = await this.simulateRegistrationFeeUallo(newWallet);
    }
    if (baseFeeUallo == null || !Number.isFinite(baseFeeUallo)) {
      baseFeeUallo = 2_000_000;
    }
    const fundingTargetUallo = Math.ceil(baseFeeUallo * config.REG_FEE_SAFETY_MULTIPLIER);
    // 3.2 Fund wallet up to the computed target
    const fundingSuccessful = await this.fundNewWallet(newWallet, fundingTargetUallo);
    if (!fundingSuccessful) {
      log.error({ walletId: newWallet.id }, 'Registration failed: Funding transaction failed. Rolling back wallet creation.');
      // If funding fails, we must clean up the wallet and its secret.
      await this.cleanupFailedRegistration(newWallet);
      throw new Error('Failed to fund the new model wallet. Please try again later.');
    }
    log.info({ walletAddress: newWallet.address }, 'Wallet funded successfully.');

    // Step 3.5: Register the wallet on-chain for the topic
    let registrationTxHash: string | undefined;
    try {
      const mnemonic = await secretsService.getSecret(newWallet.secretRef);
      if (!mnemonic) {
        throw new Error('Mnemonic not found for new wallet');
      }
      const reg = await alloraConnectorService.registerWorkerOnChain(mnemonic, data.topicId);
      if (!reg) {
        throw new Error('On-chain registration failed');
      }
      log.info({ txHash: reg.txHash }, 'On-chain registration complete');
      registrationTxHash = reg.txHash;
    } catch (e) {
      log.error({ err: e }, 'Registration failed; cleaning up wallet');
      await this.cleanupFailedRegistration(newWallet);
      throw e;
    }

    // Step 4: Persist the model's metadata to the database.
    try {
      const modelQuery = `
        INSERT INTO models (user_id, wallet_id, webhook_url, topic_id, is_inferer, is_forecaster, max_gas_price, registration_fee_uallo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `;
      const modelValues = [
        data.userId,
        newWallet.id,
        data.webhookUrl,
        data.topicId,
        data.isInferer,
        data.isForecaster,
        data.maxGasPrice,
        // Persist the actual funding amount used: (param or simulated) × safety multiplier
        fundingTargetUallo,
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
        registrationTxHash,
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
  private async fundNewWallet(newWallet: CreatedWallet, targetUallo: number): Promise<boolean> {
    const treasuryMnemonic = await secretsService.getSecret(config.TREASURY_MNEMONIC_SECRET_KEY);
    if (!treasuryMnemonic) {
      logger.fatal('CRITICAL: Treasury wallet mnemonic is not available in secrets manager.');
      // Cannot proceed without the treasury mnemonic.
      return false;
    }

    // Derive delta to reach target
    const totalTarget = Math.max(0, Math.ceil(targetUallo));

    // Check current balance and only top up the delta
    const currentBalance = await alloraConnectorService.getAccountBalance(newWallet.address);
    const current = typeof currentBalance === 'number' && Number.isFinite(currentBalance) ? currentBalance : 0;
    const delta = Math.max(0, totalTarget - current);
    if (delta === 0) {
      logger.info({ address: newWallet.address, current }, 'Wallet already meets or exceeds target funding; skipping treasury transfer.');
      return true;
    }

    const amountToSend = `${delta}uallo`;
    const transferResult = await alloraConnectorService.transferFunds(
      treasuryMnemonic,
      newWallet.address,
      amountToSend
    );

    return transferResult !== null;
  }

  /**
   * Simulate the on-chain registration to estimate the fee in uallo for funding.
   * Falls back to a sane constant if simulation somehow fails repeatedly.
   */
  private async simulateRegistrationFeeUallo(newWallet: CreatedWallet): Promise<number> {
    try {
      const mnemonic = await secretsService.getSecret(newWallet.secretRef);
      if (!mnemonic) return 2_000_000; // conservative fallback

      const wallet = await alloraConnectorService;
      // We cannot directly get gasUsed via public helper, so we approximate by performing
      // a local simulation flow similar to registerWorkerOnChain but without broadcasting.
      const rpc = (alloraConnectorService as any).getCurrentRpcNode?.() || '';
      // Recreate signer
      const signer = await (await import('@cosmjs/proto-signing')).DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'allo' });
      const [account] = await signer.getAccounts();
      const { SigningStargateClient, GasPrice, calculateFee } = await import('@cosmjs/stargate');
      // Gas price: use connector's effective gas price for treasury gas price baseline
      const gasPrice = await (alloraConnectorService as any).getEffectiveGasPrice?.('10uallo');
      const client = await SigningStargateClient.connectWithSigner(rpc, signer, { gasPrice });

      // Build a minimal RegisterRequest message
      const { RegisterRequest: V9RegisterRequest } = await import('@/generated/emissions/v9/register');
      const msg = {
        typeUrl: '/emissions.v9.RegisterRequest',
        value: V9RegisterRequest.fromPartial({ sender: account.address, topicId: 1 as any, owner: account.address, isReputer: false }),
      } as any;

      // Simulate with a placeholder topicId (gas roughly invariant w.r.t id)
      const simulated = await client.simulate(account.address, [msg], undefined);
      const gasUsed = Number(simulated);
      const fee = calculateFee(Math.ceil(gasUsed * 1.0), gasPrice);
      // fee.amount is array of coins; take first denom uallo
      const amount = Array.isArray((fee as any).amount) && (fee as any).amount[0]?.amount
        ? Number((fee as any).amount[0].amount)
        : 2_000_000;
      return amount;
    } catch (_e) {
      return 2_000_000; // conservative fallback
    }
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

  /**
   * Retrieves all models for a specific user.
   * @param userId The ID of the user.
   * @returns A promise resolving to an array of models or null if error.
   */
  public async getModelsByUserId(userId: string): Promise<any[] | null> {
    const log = logger.child({ service: 'ModelService', method: 'getModelsByUserId', userId });

    try {
      const query = `
        SELECT id, user_id, wallet_id, webhook_url, topic_id, is_inferer, is_forecaster, max_gas_price, is_active, created_at, updated_at
        FROM models
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [userId]);

      log.info({ userId, modelCount: result.rows.length }, 'Successfully retrieved user models from database.');
      return result.rows;
    } catch (error) {
      log.error({ err: error, userId }, 'An error occurred while retrieving user models from database.');
      return null;
    }
  }

  /**
   * Retrieves a specific model by its ID.
   * @param modelId The ID of the model.
   * @returns A promise resolving to the model or null if not found.
   */
  public async getModelById(modelId: string): Promise<any | null> {
    const log = logger.child({ service: 'ModelService', method: 'getModelById', modelId });

    try {
      const query = `
        SELECT id, user_id, wallet_id, webhook_url, topic_id, model_type, max_gas_price, is_active, created_at, updated_at
        FROM models
        WHERE id = $1
      `;
      const result = await pool.query(query, [modelId]);

      if (result.rows.length === 0) {
        log.warn({ modelId }, 'Model not found in database.');
        return null;
      }

      log.info({ modelId }, 'Successfully retrieved model from database.');
      return result.rows[0];
    } catch (error) {
      log.error({ err: error, modelId }, 'An error occurred while retrieving model from database.');
      return null;
    }
  }
}


/**
 * Singleton instance of the ModelService.
 */
const modelService = new ModelService();
export default modelService; 
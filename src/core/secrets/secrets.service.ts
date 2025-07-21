/**
 * @description
 * This file provides a hybrid implementation of the ISecretsService.
 * In development, it uses in-memory storage. In production, it uses HashiCorp Vault.
 *
 * @dependencies
 * - @/core/secrets/secrets.interface: The interface this service implements.
 * - @/core/secrets/vault-secrets.service: Production Vault implementation.
 * - @/utils/logger: The structured logger for logging operations.
 * - @/config: For accessing Vault configuration.
 */

import { ISecretsService } from '@/core/secrets/secrets.interface';
import logger from '@/utils/logger';
import { config } from '@/config';
import VaultSecretsService from './vault-secrets.service';

class SecretsService implements ISecretsService {
  private store: Map<string, string>;
  private vaultService: VaultSecretsService | null = null;
  private isProduction: boolean;

  constructor() {
    this.store = new Map<string, string>();
    this.isProduction = process.env.NODE_ENV === 'production';

    if (this.isProduction) {
      try {
        this.vaultService = new VaultSecretsService();
        logger.info('SecretsService initialized with HashiCorp Vault for production.');
      } catch (error) {
        logger.error({ err: error }, 'Failed to initialize Vault service. Falling back to in-memory storage.');
        logger.warn('⚠️  WARNING: Running in production with in-memory storage. This is NOT secure!');
      }
    } else {
      logger.info('SecretsService initialized with in-memory storage for development.');
    }
  }

  /**
   * Retrieves a secret from Vault (production) or in-memory store (development).
   * @param key The unique identifier for the secret.
   * @returns A promise that resolves with the secret string or null if not found.
   */
  public async getSecret(key: string): Promise<string | null> {
    if (this.isProduction && this.vaultService) {
      return await this.vaultService.getSecret(key);
    }

    const secret = this.store.get(key);
    if (secret) {
      logger.debug({ key }, 'Retrieved secret from in-memory store.');
      return secret;
    }
    logger.warn({ key }, 'Secret not found in in-memory store.');
    return null;
  }

  /**
   * Stores a secret in Vault (production) or in-memory store (development).
   * @param key The unique identifier for the secret.
   * @param value The secret string to store.
   * @returns A promise that resolves when the operation is complete.
   */
  public async storeSecret(key: string, value: string): Promise<void> {
    if (this.isProduction && this.vaultService) {
      return await this.vaultService.storeSecret(key, value);
    }

    this.store.set(key, value);
    logger.debug({ key }, 'Stored secret in in-memory store.');
  }

  /**
   * Deletes a secret from Vault (production) or in-memory store (development).
   * @param key The unique identifier for the secret to delete.
   * @returns A promise that resolves when the operation is complete.
   */
  public async deleteSecret(key: string): Promise<void> {
    if (this.isProduction && this.vaultService) {
      return await this.vaultService.deleteSecret(key);
    }

    const wasPresent = this.store.delete(key);
    if (wasPresent) {
      logger.debug({ key }, 'Deleted secret from in-memory store.');
    } else {
      logger.warn({ key }, 'Attempted to delete a secret that was not found.');
    }
  }
}

/**
 * Singleton instance of the SecretsService.
 * Exporting a single instance ensures that the same store is used throughout the application.
 */
const secretsService = new SecretsService();
export default secretsService; 
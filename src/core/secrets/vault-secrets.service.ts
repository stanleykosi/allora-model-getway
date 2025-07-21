/**
 * @description
 * This file provides a production-ready implementation of the ISecretsService
 * using HashiCorp Vault for secure secret management.
 *
 * @dependencies
 * - node-vault: For interacting with HashiCorp Vault
 * - @/core/secrets/secrets.interface: The interface this service implements.
 * - @/utils/logger: The structured logger for logging operations.
 * - @/config: For accessing Vault configuration.
 *
 * @notes
 * - This implementation is designed for production use with HashiCorp Vault
 * - All secrets are encrypted and stored securely in Vault
 * - Supports Vault namespaces for multi-tenancy
 */

import vault from 'node-vault';
import { ISecretsService } from '@/core/secrets/secrets.interface';
import logger from '@/utils/logger';
import { config } from '@/config';

interface VaultSecret {
  data: {
    data: {
      value: string;
    };
  };
}

class VaultSecretsService implements ISecretsService {
  private vaultClient: vault.client;
  private secretPath: string;

  constructor() {
    // Validate Vault configuration
    if (!config.VAULT_ADDR || !config.VAULT_TOKEN) {
      logger.error('Vault configuration is missing. VAULT_ADDR and VAULT_TOKEN are required for production.');
      throw new Error('Missing Vault configuration. Set VAULT_ADDR and VAULT_TOKEN environment variables.');
    }

    // Initialize Vault client
    this.vaultClient = vault({
      apiVersion: 'v1',
      endpoint: config.VAULT_ADDR,
      token: config.VAULT_TOKEN,
    });

    // Set namespace if configured
    if (config.VAULT_NAMESPACE) {
      // Note: Namespace handling is done via environment variable or direct API calls
      // The node-vault library handles namespaces automatically when VAULT_NAMESPACE env var is set
      process.env.VAULT_NAMESPACE = config.VAULT_NAMESPACE;
    }

    // Use the correct path for KV v2
    this.secretPath = config.VAULT_SECRET_PATH;
    logger.info('VaultSecretsService initialized with HashiCorp Vault client.');
  }

  /**
   * Retrieves a secret from HashiCorp Vault.
   * @param key The unique identifier for the secret.
   * @returns A promise that resolves with the secret string or null if not found.
   */
  public async getSecret(key: string): Promise<string | null> {
    try {
      const secretPath = `${this.secretPath}/${key}`;
      logger.debug({ key, secretPath }, 'Retrieving secret from Vault');

      const secret = await this.vaultClient.read(secretPath) as VaultSecret;

      if (secret?.data?.data?.value) {
        logger.debug({ key }, 'Successfully retrieved secret from Vault');
        return secret.data.data.value;
      } else {
        logger.warn({ key }, 'Secret not found in Vault or has invalid structure');
        return null;
      }
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        logger.warn({ key }, 'Secret not found in Vault');
        return null;
      }
      logger.error({ err: error, key }, 'Failed to retrieve secret from Vault');
      throw new Error(`Failed to retrieve secret '${key}' from Vault: ${error.message}`);
    }
  }

  /**
   * Stores a secret in HashiCorp Vault.
   * @param key The unique identifier for the secret.
   * @param value The secret string to store.
   * @returns A promise that resolves when the operation is complete.
   */
  public async storeSecret(key: string, value: string): Promise<void> {
    try {
      const secretPath = `${this.secretPath}/${key}`;
      logger.debug({ key, secretPath }, 'Storing secret in Vault');

      await this.vaultClient.write(secretPath, {
        data: { value }
      });

      logger.debug({ key }, 'Successfully stored secret in Vault');
    } catch (error: any) {
      logger.error({ err: error, key }, 'Failed to store secret in Vault');
      throw new Error(`Failed to store secret '${key}' in Vault: ${error.message}`);
    }
  }

  /**
   * Deletes a secret from HashiCorp Vault.
   * @param key The unique identifier for the secret to delete.
   * @returns A promise that resolves when the operation is complete.
   */
  public async deleteSecret(key: string): Promise<void> {
    try {
      const secretPath = `${this.secretPath}/${key}`;
      logger.debug({ key, secretPath }, 'Deleting secret from Vault');

      await this.vaultClient.delete(secretPath);

      logger.debug({ key }, 'Successfully deleted secret from Vault');
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        logger.warn({ key }, 'Attempted to delete a secret that was not found in Vault');
        return;
      }
      logger.error({ err: error, key }, 'Failed to delete secret from Vault');
      throw new Error(`Failed to delete secret '${key}' from Vault: ${error.message}`);
    }
  }

  /**
   * Tests the Vault connection and authentication.
   * @returns A promise that resolves to true if connection is successful.
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.vaultClient.status();
      logger.info('Vault connection test successful');
      return true;
    } catch (error: any) {
      logger.error({ err: error }, 'Vault connection test failed');
      return false;
    }
  }
}

export default VaultSecretsService; 
/**
 * @description
 * This file defines the interface for the Secrets Management Service.
 * It establishes a contract that any secrets provider (e.g., in-memory map,
 * HashiCorp Vault, AWS KMS) must adhere to. This abstraction is critical
 * for decoupling the core application logic from the specific secrets
 * management implementation, allowing for easy substitution between
 * development and production environments.
 *
 * @interface ISecretsService
 *
 * @method getSecret(key: string): Promise<string | null>
 * - Asynchronously retrieves a secret value associated with the given key.
 * - Returns the secret as a string if found, or null if the key does not exist.
 *
 * @method storeSecret(key: string, value: string): Promise<void>
 * - Asynchronously stores a secret value with the specified key.
 * - This is essential for securely saving newly generated wallet mnemonics.
 *
 * @method deleteSecret(key: string): Promise<void>
 * - Asynchronously deletes a secret associated with the given key.
 * - Useful for cleanup and key rotation policies.
 */

export interface ISecretsService {
  /**
   * Retrieves a secret by its key.
   * @param key The unique identifier for the secret.
   * @returns A promise that resolves to the secret string, or null if not found.
   */
  getSecret(key: string): Promise<string | null>;

  /**
   * Stores a secret value under a given key.
   * @param key The unique identifier for the secret.
   * @param value The secret string to store.
   * @returns A promise that resolves when the secret is successfully stored.
   */
  storeSecret(key: string, value: string): Promise<void>;

  /**
   * Deletes a secret by its key.
   * @param key The unique identifier for the secret to delete.
   * @returns A promise that resolves when the secret is successfully deleted.
   */
  deleteSecret(key: string): Promise<void>;
} 
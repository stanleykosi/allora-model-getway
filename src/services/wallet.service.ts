/**
 * @description
 * This service is responsible for managing the lifecycle of wallets associated
 * with registered models. It handles the creation of new wallets, secure storage
 * of their mnemonic phrases, and persistence of public wallet information in
 * the database.
 *
 * @dependencies
 * - @cosmjs/crypto: For generating BIP39 mnemonic phrases.
 * - @cosmjs/stargate: For deriving wallet addresses from mnemonics.
 * - uuid: For generating unique identifiers for secret references.
 * - @/core/secrets/secrets.service: The service for storing mnemonics securely.
 * - @/persistence/postgres.client: The database client for saving wallet records.
 * - @/utils/logger: The structured logger for logging operations.
 */

import { Bip39, Random } from '@cosmjs/crypto';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { v4 as uuidv4 } from 'uuid';
import secretsService from '@/core/secrets/secrets.service';
import pool from '@/persistence/postgres.client';
import logger from '@/utils/logger';

/**
 * @interface Wallet
 * @description Defines the structure of a wallet record as returned from the database.
 */
export interface Wallet {
  id: string;
  address: string;
  secret_ref: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * @interface CreatedWallet
 * @description Defines the data structure returned upon successful wallet creation.
 * Includes the secretRef for potential cleanup operations by the calling service.
 */
export interface CreatedWallet {
  id: string;
  address: string;
  secretRef: string;
}


class WalletService {
  /**
   * Creates a new Allora wallet, securely stores its mnemonic, and saves its
   * public details to the database. This entire process is designed to be
   * atomic and resilient.
   *
   * @returns A Promise that resolves to an object containing the new wallet's
   *          ID, public address, and secret reference, or null if creation fails.
   */
  public async createWallet(): Promise<CreatedWallet | null> {
    const log = logger.child({ service: 'WalletService', method: 'createWallet' });
    try {
      // Step 1: Generate a new 24-word BIP39 mnemonic phrase.
      // This is the master key for the wallet.
      const entropy = Random.getBytes(32);
      const mnemonic = Bip39.encode(entropy).toString();
      log.info('Generated new wallet mnemonic.');

      // Step 2: Derive the public address from the mnemonic using the Cosmos SDK's
      // HD wallet implementation. We explicitly set the address prefix to 'allo'.
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: 'allo',
      });
      const [account] = await wallet.getAccounts();
      const address = account.address;
      log.info({ address }, 'Derived wallet address from mnemonic.');

      // Step 3: Create a unique reference key for storing the secret.
      // This key will be stored in the database, while the mnemonic it refers to
      // will be in the secure secrets manager.
      const secretRef = `wallet_mnemonic_${uuidv4()}`;

      // Step 4: Securely store the mnemonic phrase in the secrets manager.
      // This is a critical security step.
      await secretsService.storeSecret(secretRef, mnemonic);
      log.info({ secretRef }, 'Successfully stored wallet mnemonic in secrets manager.');

      // Step 5: Persist the public wallet details to the database.
      // We only store the public address and the reference to the secret.
      const query = `
        INSERT INTO wallets (address, secret_ref)
        VALUES ($1, $2)
        RETURNING id, address, secret_ref;
      `;
      const values = [address, secretRef];

      const result = await pool.query<Wallet>(query, values);
      const newWallet = result.rows[0];

      if (!newWallet) {
        // This is a critical failure state. The secret was stored, but the DB
        // record failed to be created. We must attempt to clean up the stored
        // secret to prevent orphaned secrets and maintain consistency.
        log.error({ address, secretRef }, 'Failed to insert wallet into database, attempting to roll back secret storage.');
        await secretsService.deleteSecret(secretRef);
        log.warn({ secretRef }, 'Orphaned secret has been successfully deleted.');
        throw new Error('Database insertion failed to return the new wallet record.');
      }

      log.info({ walletId: newWallet.id, address: newWallet.address }, 'Wallet created and saved to database successfully.');
      return { id: newWallet.id, address: newWallet.address, secretRef: newWallet.secret_ref };
    } catch (error) {
      log.error({ err: error }, 'An unexpected error occurred during wallet creation.');
      // This catch block handles errors from any step: mnemonic generation,
      // secret storage, or database insertion. The cleanup logic for orphaned
      // secrets is handled specifically within the `if (!newWallet)` block.
      return null;
    }
  }
}

/**
 * Singleton instance of the WalletService. This ensures that the service is
 * instantiated only once and can be shared across the application.
 */
const walletService = new WalletService();
export default walletService; 
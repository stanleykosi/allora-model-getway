#!/usr/bin/env node

/**
 * @description
 * This script helps set up the treasury mnemonic in the in-memory secrets store
 * for testing purposes. It reads the mnemonic from an environment variable or
 * prompts the user to enter it manually.
 * 
 * Usage:
 *   node scripts/setup-treasury.js
 *   TREASURY_MNEMONIC="your mnemonic here" node scripts/setup-treasury.js
 */

const readline = require('readline');

// Import the secrets service
const secretsService = require('../dist/core/secrets/secrets.service').default;
const { config } = require('../dist/config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupTreasuryMnemonic() {
  console.log('🔐 Treasury Mnemonic Setup for Testing');
  console.log('=====================================\n');

  // Check if mnemonic is provided via environment variable
  const envMnemonic = process.env.TREASURY_MNEMONIC;

  if (envMnemonic) {
    console.log('✅ Found TREASURY_MNEMONIC in environment variables');
    secretsService.addSecretForTesting(config.TREASURY_MNEMONIC_SECRET_KEY, envMnemonic);
    console.log('✅ Treasury mnemonic has been added to the secrets store');
    rl.close();
    return;
  }

  // Prompt user to enter mnemonic manually
  console.log('No TREASURY_MNEMONIC environment variable found.');
  console.log('Please enter your treasury wallet mnemonic (24 words):\n');

  rl.question('Mnemonic: ', (mnemonic) => {
    if (!mnemonic || mnemonic.trim().split(' ').length !== 24) {
      console.log('❌ Invalid mnemonic. Please provide exactly 24 words.');
      rl.close();
      return;
    }

    try {
      secretsService.addSecretForTesting(config.TREASURY_MNEMONIC_SECRET_KEY, mnemonic.trim());
      console.log('✅ Treasury mnemonic has been added to the secrets store');
    } catch (error) {
      console.log('❌ Failed to add treasury mnemonic:', error.message);
    }

    rl.close();
  });
}

// Run the setup
setupTreasuryMnemonic().catch(console.error); 
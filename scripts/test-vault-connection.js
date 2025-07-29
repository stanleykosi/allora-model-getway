#!/usr/bin/env node

/**
 * @description
 * This script tests the Vault connection and verifies that secrets can be stored and retrieved.
 * It's useful for debugging Vault connection issues.
 * 
 * Usage:
 *   node scripts/test-vault-connection.js
 *   VAULT_ADDR=https://your-vault.railway.app VAULT_TOKEN=your-token node scripts/test-vault-connection.js
 */

const { config } = require('../dist/config');
const VaultSecretsService = require('../dist/core/secrets/vault-secrets.service').default;

async function testVaultConnection() {
  console.log('🔐 Testing Vault Connection');
  console.log('============================\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   VAULT_ADDR: ${process.env.VAULT_ADDR || 'NOT SET'}`);
  console.log(`   VAULT_TOKEN: ${process.env.VAULT_TOKEN ? 'SET' : 'NOT SET'}`);
  console.log(`   VAULT_SECRET_PATH: ${process.env.VAULT_SECRET_PATH || 'NOT SET'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);

  if (!process.env.VAULT_ADDR || !process.env.VAULT_TOKEN) {
    console.log('\n❌ Missing required Vault environment variables');
    console.log('Please set VAULT_ADDR and VAULT_TOKEN');
    process.exit(1);
  }

  try {
    console.log('\n🔍 Initializing Vault service...');
    const vaultService = new VaultSecretsService();

    console.log('✅ Vault service initialized');

    // Test connection
    console.log('\n🔍 Testing Vault connection...');
    const isConnected = await vaultService.testConnection();

    if (isConnected) {
      console.log('✅ Vault connection successful!');
    } else {
      console.log('❌ Vault connection failed');
      process.exit(1);
    }

    // Test secret operations
    console.log('\n🧪 Testing secret operations...');

    const testKey = 'test-connection-key';
    const testValue = 'test-secret-value-' + Date.now();

    // Store test secret
    console.log('📝 Storing test secret...');
    await vaultService.storeSecret(testKey, testValue);
    console.log('✅ Secret storage successful');

    // Retrieve test secret
    console.log('📖 Retrieving test secret...');
    const retrievedValue = await vaultService.getSecret(testKey);

    if (retrievedValue === testValue) {
      console.log('✅ Secret retrieval successful');
    } else {
      console.log('❌ Secret retrieval failed');
      console.log(`   Expected: ${testValue}`);
      console.log(`   Got: ${retrievedValue}`);
      process.exit(1);
    }

    // Clean up test secret
    console.log('🗑️  Cleaning up test secret...');
    await vaultService.deleteSecret(testKey);
    console.log('✅ Secret cleanup successful');

    console.log('\n🎉 All Vault tests passed!');
    console.log('\n📋 Your Vault is ready for production use.');
    console.log('\n📝 Next steps:');
    console.log('1. Add your treasury mnemonic to Vault:');
    console.log(`   vault kv put secret/data/mcp/${config.TREASURY_MNEMONIC_SECRET_KEY} value="your 24 word mnemonic"`);
    console.log('2. Set NODE_ENV=production in your Railway project');
    console.log('3. Redeploy your application');

  } catch (error) {
    console.log('\n❌ Vault test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify VAULT_ADDR is correct and accessible');
    console.log('2. Verify VAULT_TOKEN is valid and has proper permissions');
    console.log('3. Check if Vault service is running');
    console.log('4. Check Railway logs for Vault service');
    process.exit(1);
  }
}

testVaultConnection().catch(console.error); 
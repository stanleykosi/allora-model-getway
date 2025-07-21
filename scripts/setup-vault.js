#!/usr/bin/env node

/**
 * @description
 * This script helps set up HashiCorp Vault configuration for production deployment.
 * It tests the Vault connection and provides guidance for proper configuration.
 * 
 * Usage:
 *   node scripts/setup-vault.js
 *   NODE_ENV=production node scripts/setup-vault.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupVault() {
  console.log('🔐 HashiCorp Vault Setup for Production');
  console.log('========================================\n');

  // Check if Vault configuration is provided
  const vaultAddr = process.env.VAULT_ADDR;
  const vaultToken = process.env.VAULT_TOKEN;
  const vaultNamespace = process.env.VAULT_NAMESPACE;

  if (!vaultAddr || !vaultToken) {
    console.log('❌ Missing Vault configuration.');
    console.log('\n📋 Required Environment Variables:');
    console.log('   VAULT_ADDR=https://your-vault-server:8200');
    console.log('   VAULT_TOKEN=your-vault-token');
    console.log('   VAULT_NAMESPACE=your-namespace (optional)');
    console.log('\n🔧 Setup Instructions:');
    console.log('1. Install and configure HashiCorp Vault');
    console.log('2. Create a token with appropriate permissions');
    console.log('3. Set the environment variables above');
    console.log('4. Run this script again');
    rl.close();
    return;
  }

  console.log('✅ Vault configuration found:');
  console.log(`   VAULT_ADDR: ${vaultAddr}`);
  console.log(`   VAULT_TOKEN: ${vaultToken.substring(0, 8)}...`);
  if (vaultNamespace) {
    console.log(`   VAULT_NAMESPACE: ${vaultNamespace}`);
  }

  // Test Vault connection
  console.log('\n🔍 Testing Vault connection...');
  
  try {
    // Import the Vault service to test connection
    const { default: VaultSecretsService } = require('../dist/core/secrets/vault-secrets.service');
    const vaultService = new VaultSecretsService();
    
    const isConnected = await vaultService.testConnection();
    
    if (isConnected) {
      console.log('✅ Vault connection successful!');
      
      // Test secret operations
      console.log('\n🧪 Testing secret operations...');
      
      const testKey = 'test-connection-key';
      const testValue = 'test-secret-value';
      
      // Store test secret
      await vaultService.storeSecret(testKey, testValue);
      console.log('✅ Secret storage test successful');
      
      // Retrieve test secret
      const retrievedValue = await vaultService.getSecret(testKey);
      if (retrievedValue === testValue) {
        console.log('✅ Secret retrieval test successful');
      } else {
        console.log('❌ Secret retrieval test failed');
      }
      
      // Clean up test secret
      await vaultService.deleteSecret(testKey);
      console.log('✅ Secret deletion test successful');
      
      console.log('\n🎉 Vault setup is complete and working!');
      console.log('\n📋 Next Steps:');
      console.log('1. Set NODE_ENV=production in your environment');
      console.log('2. Add your treasury mnemonic to Vault:');
      console.log(`   vault kv put secret/data/mcp/${process.env.TREASURY_MNEMONIC_SECRET_KEY || 'treasury-mnemonic'} value="your 24 word mnemonic"`);
      console.log('3. Start your application in production mode');
      
    } else {
      console.log('❌ Vault connection failed');
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Verify VAULT_ADDR is correct and accessible');
      console.log('2. Verify VAULT_TOKEN has appropriate permissions');
      console.log('3. Check Vault server logs for errors');
    }
    
  } catch (error) {
    console.log('❌ Vault setup failed:', error.message);
    console.log('\n🔧 Common Issues:');
    console.log('1. Vault server not running or not accessible');
    console.log('2. Invalid or expired token');
    console.log('3. Network connectivity issues');
    console.log('4. Vault namespace issues (if using namespaces)');
  }

  rl.close();
}

setupVault().catch(console.error); 
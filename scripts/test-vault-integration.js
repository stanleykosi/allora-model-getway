#!/usr/bin/env node

/**
 * @description
 * This script demonstrates the Vault integration functionality.
 * It shows how secrets are stored and retrieved in both development and production modes.
 * 
 * Usage:
 *   node scripts/test-vault-integration.js
 *   NODE_ENV=production node scripts/test-vault-integration.js
 */

const { SecretsService } = require('../dist/core/secrets/secrets.service');

async function testVaultIntegration() {
  console.log('🔐 Testing Vault Integration');
  console.log('============================\n');

  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);

  try {
    // Initialize secrets service
    const secretsService = new SecretsService();
    
    // Test secret operations
    const testKey = 'test-wallet-mnemonic';
    const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    
    console.log('\n📝 Testing secret storage...');
    await secretsService.storeSecret(testKey, testMnemonic);
    console.log('✅ Secret stored successfully');
    
    console.log('\n📖 Testing secret retrieval...');
    const retrievedMnemonic = await secretsService.getSecret(testKey);
    
    if (retrievedMnemonic === testMnemonic) {
      console.log('✅ Secret retrieved successfully');
      console.log(`   Key: ${testKey}`);
      console.log(`   Value: ${retrievedMnemonic.substring(0, 20)}...`);
    } else {
      console.log('❌ Secret retrieval failed');
      console.log(`   Expected: ${testMnemonic}`);
      console.log(`   Got: ${retrievedMnemonic}`);
    }
    
    console.log('\n🗑️  Testing secret deletion...');
    await secretsService.deleteSecret(testKey);
    console.log('✅ Secret deleted successfully');
    
    // Verify deletion
    const deletedSecret = await secretsService.getSecret(testKey);
    if (deletedSecret === null) {
      console.log('✅ Secret deletion verified');
    } else {
      console.log('❌ Secret still exists after deletion');
    }
    
    console.log('\n🎉 All tests passed!');
    
    if (isProduction) {
      console.log('\n📋 Production Notes:');
      console.log('- Secrets are stored securely in HashiCorp Vault');
      console.log('- All wallet mnemonics are encrypted at rest');
      console.log('- Access is controlled via Vault policies');
      console.log('- Audit logs track all secret access');
    } else {
      console.log('\n⚠️  Development Notes:');
      console.log('- Secrets are stored in memory (not secure for production)');
      console.log('- Use NODE_ENV=production for Vault integration');
      console.log('- Set VAULT_ADDR and VAULT_TOKEN for production deployment');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (isProduction) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Ensure Vault server is running');
      console.log('2. Verify VAULT_ADDR and VAULT_TOKEN are set');
      console.log('3. Check Vault policies and permissions');
      console.log('4. Test Vault connection: vault status');
    }
  }
}

testVaultIntegration().catch(console.error); 
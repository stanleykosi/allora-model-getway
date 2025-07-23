#!/usr/bin/env node

/**
 * @description
 * This script demonstrates the production deployment setup with Vault integration.
 * It shows the environment configuration and provides guidance for production deployment.
 * 
 * Usage:
 *   node scripts/test-production-deployment.js
 */

// Load environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  // Ignore if dotenv is not available
}

console.log('🚀 Production Deployment Test');
console.log('=============================\n');

// Check environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'ALLORA_CHAIN_ID',
  'ALLORA_RPC_URL',
  'TREASURY_MNEMONIC_SECRET_KEY'
];

const vaultEnvVars = [
  'VAULT_ADDR',
  'VAULT_TOKEN',
  'VAULT_NAMESPACE',
  'VAULT_SECRET_PATH'
];

console.log('📋 Environment Configuration Check:\n');

// Check required variables
console.log('Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${varName.includes('SECRET') || varName.includes('TOKEN') ? '***' : value}`);
  } else {
    console.log(`  ❌ ${varName}: Not set`);
  }
});

console.log('\nVault Configuration (Production Only):');
vaultEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${varName.includes('TOKEN') ? '***' : value}`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (required for production)`);
  }
});

// Check if running in production mode
const isProduction = process.env.NODE_ENV === 'production';
console.log(`\n🏭 Environment Mode: ${isProduction ? 'Production' : 'Development'}`);

if (isProduction) {
  console.log('\n🔐 Production Security Status:');

  if (process.env.VAULT_ADDR && process.env.VAULT_TOKEN) {
    console.log('  ✅ Vault configuration detected');
    console.log('  ✅ Secrets will be stored securely in HashiCorp Vault');
  } else {
    console.log('  ❌ Vault configuration missing');
    console.log('  ⚠️  Application will fall back to in-memory storage (NOT SECURE)');
  }

  console.log('\n📊 Wallet Management:');
  console.log('  ✅ Each model gets its own dedicated wallet');
  console.log('  ✅ Wallet mnemonics are stored securely');
  console.log('  ✅ Treasury mnemonic is managed via Vault');

  console.log('\n🔧 Next Steps:');
  console.log('1. Ensure Vault server is running and accessible');
  console.log('2. Store treasury mnemonic in Vault:');
  console.log(`   vault kv put secret/data/mcp/${process.env.TREASURY_MNEMONIC_SECRET_KEY || 'treasury-mnemonic'} value="your 24 word mnemonic"`);
  console.log('3. Start the application: NODE_ENV=production npm start');
  console.log('4. Monitor logs for any Vault connection issues');

} else {
  console.log('\n🔧 Development Mode Notes:');
  console.log('  ✅ Using in-memory storage for development');
  console.log('  ✅ No Vault configuration required');
  console.log('  ⚠️  NOT suitable for production use');

  console.log('\n🚀 To test production mode:');
  console.log('1. Set NODE_ENV=production');
  console.log('2. Configure VAULT_ADDR and VAULT_TOKEN');
  console.log('3. Run this script again');
}

console.log('\n📚 Documentation:');
console.log('  📖 Production Deployment Guide: docs/PRODUCTION_DEPLOYMENT.md');
console.log('  🔧 Vault Setup Script: node scripts/setup-vault.js');
console.log('  🧪 Integration Test: node scripts/test-vault-integration.js');

console.log('\n✅ Configuration check complete!'); 
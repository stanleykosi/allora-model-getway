#!/usr/bin/env node

/**
 * @description
 * This script tests Vault storage functionality directly.
 */

const vault = require('node-vault');

async function testVaultStorage() {
  console.log('🔐 Testing Vault Storage Directly');
  console.log('==================================\n');

  try {
    // Initialize Vault client
    const vaultClient = vault({
      apiVersion: 'v1',
      endpoint: 'http://127.0.0.1:8200',
      token: 'YOUR_VAULT_TOKEN_HERE',
    });

    console.log('✅ Vault client initialized');

    // Test storing a secret
    const testKey = 'test-wallet-mnemonic';
    const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    console.log('\n📝 Storing test secret...');
    await vaultClient.write('secret/data/mcp/test-wallet-mnemonic', {
      data: { value: testMnemonic }
    });
    console.log('✅ Test secret stored successfully');

    // Test retrieving the secret
    console.log('\n📖 Retrieving test secret...');
    const result = await vaultClient.read('secret/data/mcp/test-wallet-mnemonic');
    console.log('✅ Test secret retrieved successfully');
    console.log(`   Value: ${result.data.data.value.substring(0, 20)}...`);

    // Test storing a wallet mnemonic with the same pattern as the app
    const walletId = 'test-wallet-123';
    const walletMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const secretKey = `wallet_mnemonic_${walletId}`;

    console.log('\n📝 Storing wallet mnemonic...');
    await vaultClient.write(`secret/data/mcp/${secretKey}`, {
      data: { value: walletMnemonic }
    });
    console.log('✅ Wallet mnemonic stored successfully');

    // Test retrieving the wallet mnemonic
    console.log('\n📖 Retrieving wallet mnemonic...');
    const walletResult = await vaultClient.read(`secret/data/mcp/${secretKey}`);
    console.log('✅ Wallet mnemonic retrieved successfully');
    console.log(`   Key: ${secretKey}`);
    console.log(`   Value: ${walletResult.data.data.value.substring(0, 20)}...`);

    console.log('\n🎉 All Vault storage tests passed!');

  } catch (error) {
    console.error('❌ Vault test failed:', error.message);
    console.error('Full error:', error);
  }
}

testVaultStorage().catch(console.error); 
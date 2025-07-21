#!/usr/bin/env node

/**
 * @description
 * This script tests if the application is using Vault for secret storage.
 * It registers a model and then checks if the wallet mnemonic is stored in Vault.
 */

const axios = require('axios');

async function testVaultIntegration() {
  console.log('🔐 Testing Vault Integration with Application');
  console.log('=============================================\n');

  try {
    // Register a new model
    console.log('📝 Registering new model...');
    const response = await axios.post('http://localhost:3000/api/v1/models', {
      webhook_url: 'https://webhook.site/#!/test-vault-integration',
      topic_id: '1',
      model_type: 'inference',
      max_gas_price: '10uallo'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'YOUR_API_KEY_HERE'
      }
    });

    const { modelId, walletAddress } = response.data;
    console.log('✅ Model registered successfully');
    console.log(`   Model ID: ${modelId}`);
    console.log(`   Wallet Address: ${walletAddress}`);

    // Check if wallet mnemonic is stored in Vault
    console.log('\n🔍 Checking Vault for wallet mnemonic...');

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Try to get the wallet mnemonic from Vault
    const vaultKey = `wallet_mnemonic_${modelId}`;
    const vaultCommand = `export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN=YOUR_VAULT_TOKEN_HERE && /usr/bin/vault kv get secret/data/mcp/${vaultKey}`;

    try {
      const { stdout } = await execAsync(vaultCommand);
      console.log('✅ Wallet mnemonic found in Vault!');
      console.log('   This confirms the application is using Vault for secret storage.');

      // Extract the mnemonic from the output
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('value')) {
          const mnemonic = line.split('value')[1].trim();
          console.log(`   Mnemonic: ${mnemonic.substring(0, 20)}...`);
          break;
        }
      }

    } catch (error) {
      console.log('❌ Wallet mnemonic not found in Vault');
      console.log('   This might mean the application is still using in-memory storage');
      console.log('   Error:', error.message);
    }

    console.log('\n🎉 Vault integration test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVaultIntegration().catch(console.error); 
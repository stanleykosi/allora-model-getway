# Treasury Mnemonic Setup for Testing

This document explains how to set up the treasury wallet mnemonic for testing the model registration functionality.

## Why is this needed?

The `ModelService` needs access to a treasury wallet's mnemonic phrase to fund newly created model wallets. In the development environment, this is stored in an in-memory secrets store.

## Setup Options

### Option 1: Environment Variable (Recommended)

Add your treasury wallet mnemonic to your `.env.local` file:

```bash
# Add this to your .env.local file
TREASURY_MNEMONIC="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13 word14 word15 word16 word17 word18 word19 word20 word21 word22 word23 word24"
```

The application will automatically load this mnemonic into the secrets store on startup.

### Option 2: Manual Setup Script

Run the setup script to manually add the mnemonic:

```bash
# Option A: Provide mnemonic via environment variable
TREASURY_MNEMONIC="your 24 word mnemonic here" node scripts/setup-treasury.js

# Option B: Run interactively (will prompt for mnemonic)
node scripts/setup-treasury.js
```

### Option 3: Programmatic Setup

You can also add the mnemonic programmatically in your code:

```typescript
import secretsService from '@/core/secrets/secrets.service';
import { config } from '@/config';

// Add the treasury mnemonic to the secrets store
secretsService.addSecretForTesting(
  config.TREASURY_MNEMONIC_SECRET_KEY, 
  "your 24 word mnemonic here"
);
```

## Getting a Treasury Wallet

If you don't have a treasury wallet yet, you can create one using the Allora CLI:

```bash
# Generate a new wallet
allorad keys add treasury-wallet

# This will output a mnemonic phrase - save this securely!
```

## Security Notes

⚠️ **IMPORTANT**: 
- The in-memory secrets store is for development/testing only
- Never commit your actual mnemonic phrases to version control
- In production, use a proper secrets management service like HashiCorp Vault
- The `.env.local` file should be in your `.gitignore` to prevent accidental commits

## Verification

To verify the treasury mnemonic is properly set up, you can check if it's retrievable:

```typescript
import secretsService from '@/core/secrets/secrets.service';
import { config } from '@/config';

const mnemonic = await secretsService.getSecret(config.TREASURY_MNEMONIC_SECRET_KEY);
if (mnemonic) {
  console.log('✅ Treasury mnemonic is available');
} else {
  console.log('❌ Treasury mnemonic not found');
}
``` 
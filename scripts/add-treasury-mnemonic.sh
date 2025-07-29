#!/bin/bash

# Script to add treasury mnemonic to Vault
# This should be run after the application is deployed and Vault is initialized

echo "🔐 Adding Treasury Mnemonic to Vault"
echo "====================================="

# Check if treasury mnemonic is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your 24-word treasury mnemonic as an argument"
    echo "Usage: $0 \"word1 word2 word3 ... word24\""
    exit 1
fi

TREASURY_MNEMONIC="$1"

# Check if it's exactly 24 words
WORD_COUNT=$(echo "$TREASURY_MNEMONIC" | wc -w)
if [ "$WORD_COUNT" -ne 24 ]; then
    echo "❌ Invalid mnemonic. Please provide exactly 24 words."
    echo "You provided $WORD_COUNT words."
    exit 1
fi

echo "✅ Valid 24-word mnemonic provided"

# Get the container ID
CONTAINER_ID=$(docker ps --filter "ancestor=allora-mcp" --format "{{.ID}}" | head -1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ No running container found"
    echo "Make sure your application is deployed and running"
    exit 1
fi

echo "📦 Found container: $CONTAINER_ID"

# Add the treasury mnemonic to Vault
echo "📝 Adding treasury mnemonic to Vault..."
docker exec $CONTAINER_ID vault kv put secret/data/mcp/treasury-mnemonic value="$TREASURY_MNEMONIC"

if [ $? -eq 0 ]; then
    echo "✅ Treasury mnemonic successfully added to Vault!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Restart your application to load the mnemonic"
    echo "2. Test wallet creation to verify everything works"
else
    echo "❌ Failed to add treasury mnemonic to Vault"
    echo "Check if Vault is running and accessible"
    exit 1
fi 
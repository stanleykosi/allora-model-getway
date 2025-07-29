#!/bin/bash

# Script to deploy Vault to Railway and configure the main application
# This script helps set up Vault as a separate service on Railway

set -e

echo "🚀 Deploying Vault to Railway..."
echo "=================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "   npm install -g @railway/cli"
    echo "   Then run: railway login"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

echo "✅ Railway CLI is ready"

# Create a new Railway project for Vault if it doesn't exist
echo "📦 Creating Railway project for Vault..."
PROJECT_NAME="allora-vault-$(date +%s)"

# Create the project
railway init --name "$PROJECT_NAME" --directory vault

echo "✅ Created Railway project: $PROJECT_NAME"

# Deploy Vault to Railway
echo "🚀 Deploying Vault to Railway..."
cd vault
railway up

# Get the service URL
echo "⏳ Waiting for Vault service to be ready..."
sleep 30

# Get the service URL
VAULT_URL=$(railway status --json | jq -r '.services[0].url' 2>/dev/null || echo "")

if [ -z "$VAULT_URL" ]; then
    echo "❌ Could not get Vault service URL. Please check Railway dashboard."
    echo "🔗 Check your Railway dashboard for the Vault service URL"
    exit 1
fi

echo "✅ Vault deployed successfully!"
echo "🔗 Vault URL: $VAULT_URL"

# Get the Vault token from logs
echo "🔍 Getting Vault token from logs..."
sleep 10

# Try to get the token from logs
VAULT_TOKEN=$(railway logs --json | grep "Application Token:" | tail -1 | sed 's/.*Application Token: //' || echo "")

if [ -z "$VAULT_TOKEN" ]; then
    echo "⚠️  Could not automatically get Vault token from logs."
    echo "📝 Please check the Railway logs for the Vault service and copy the Application Token."
    echo "🔗 Railway dashboard: https://railway.app/dashboard"
else
    echo "✅ Found Vault token: ${VAULT_TOKEN:0:8}..."
fi

cd ..

echo ""
echo "🎉 Vault deployment complete!"
echo "=================================="
echo ""
echo "📋 Next steps:"
echo "1. Set the following environment variables in your main Railway project:"
echo "   VAULT_ADDR=$VAULT_URL"
if [ -n "$VAULT_TOKEN" ]; then
    echo "   VAULT_TOKEN=$VAULT_TOKEN"
else
    echo "   VAULT_TOKEN=<get-from-railway-logs>"
fi
echo "   VAULT_SECRET_PATH=secret/data/mcp"
echo ""
echo "2. Set NODE_ENV=production in your main Railway project"
echo ""
echo "3. Add your treasury mnemonic to Vault using the Railway CLI:"
echo "   railway run --service vault -- vault kv put secret/data/mcp/treasury-mnemonic value=\"your 24 word mnemonic\""
echo ""
echo "4. Redeploy your main application:"
echo "   railway up"
echo ""
echo "🔗 Railway Dashboard: https://railway.app/dashboard"
echo "📚 Vault Documentation: https://www.vaultproject.io/docs" 
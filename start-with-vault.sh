#!/bin/sh

#!/bin/sh

# Startup script that initializes Vault and starts the application
echo "🚀 Starting application with Vault..."

# Set NODE_ENV to production
export NODE_ENV=production
echo "✅ Set NODE_ENV=production"

# Create Vault directories
mkdir -p /tmp/vault/file
mkdir -p /tmp/vault/logs

# Start Vault in the background
echo "🔐 Starting Vault server..."
vault server -config=/app/vault-config.hcl &
VAULT_PID=$!

# Wait for Vault to start
echo "⏳ Waiting for Vault to start..."
sleep 5

# Check if Vault is already initialized
if vault status 2>/dev/null | grep -q "Initialized.*true"; then
    echo "✅ Vault is already initialized"
    
    # Load saved credentials if available
    if [ -f /tmp/vault-env ]; then
        echo "📖 Loading saved Vault credentials..."
        source /tmp/vault-env
    fi
    
    # Unseal Vault if needed
    if vault status 2>/dev/null | grep -q "Sealed.*true"; then
        echo "🔓 Unsealing Vault..."
        if [ -n "$UNSEAL_KEY" ]; then
            echo "$UNSEAL_KEY" | vault operator unseal
        else
            # Fallback for development
            echo "development-unseal-key" | vault operator unseal
        fi
    fi
else
    echo "🚀 Initializing Vault..."
    
    # Initialize Vault with 1 key share and 1 key threshold (for development)
    vault operator init -key-shares=1 -key-threshold=1 -format=json > /tmp/init.json
    
    # Extract the root token and unseal key
    ROOT_TOKEN=$(cat /tmp/init.json | jq -r '.root_token')
    UNSEAL_KEY=$(cat /tmp/init.json | jq -r '.keys_b64[0]')
    
    echo "🔑 Root Token: $ROOT_TOKEN"
    echo "🔑 Unseal Key: $UNSEAL_KEY"
    
    # Unseal Vault
    echo "🔓 Unsealing Vault..."
    vault operator unseal $UNSEAL_KEY
    
    # Login with root token
    echo "🔑 Logging in with root token..."
    vault login $ROOT_TOKEN
    
    # Enable KV v2 secrets engine
    echo "📦 Enabling KV v2 secrets engine..."
    vault secrets enable -path=secret kv-v2
    
    # Create a policy for the application
    echo "📋 Creating application policy..."
    cat > /tmp/app-policy.hcl << EOF
path "secret/data/mcp/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/mcp/*" {
  capabilities = ["read", "list"]
}
EOF
    
    vault policy write mcp-app /tmp/app-policy.hcl
    
    # Create a token for the application
    echo "🎫 Creating application token..."
    APP_TOKEN=$(vault token create -policy=mcp-app -format=json | jq -r '.auth.client_token')
    
    echo "✅ Vault initialization complete!"
    echo "🔑 Application Token: $APP_TOKEN"
    
    # Save Vault credentials to file for the application to read
    echo "VAULT_ADDR=http://0.0.0.0:8200" > /tmp/vault-env
    echo "VAULT_TOKEN=$APP_TOKEN" >> /tmp/vault-env
    echo "VAULT_SECRET_PATH=secret/data/mcp" >> /tmp/vault-env
    echo "NODE_ENV=production" >> /tmp/vault-env
    
    # Set environment variables for the application
    export VAULT_ADDR=http://0.0.0.0:8200
    export VAULT_TOKEN=$APP_TOKEN
    export VAULT_SECRET_PATH=secret/data/mcp
    
    echo "📝 Environment variables set:"
    echo "   VAULT_ADDR=http://127.0.0.1:8200"
    echo "   VAULT_TOKEN=$APP_TOKEN"
    echo "   VAULT_SECRET_PATH=secret/data/mcp"
    echo "   NODE_ENV=production"
    
    # Save initialization data for persistence
    echo "ROOT_TOKEN=$ROOT_TOKEN" >> /tmp/vault-env
    echo "UNSEAL_KEY=$UNSEAL_KEY" >> /tmp/vault-env
fi

# Set Vault environment variables
export VAULT_ADDR=http://0.0.0.0:8200
export VAULT_SECRET_PATH=secret/data/mcp

# Load saved credentials if available
if [ -f /tmp/vault-env ]; then
    echo "📖 Loading Vault environment variables..."
    source /tmp/vault-env
fi

# Ensure NODE_ENV is set to production
export NODE_ENV=production

# If no token is set, try to get it from the initialization
if [ -z "$VAULT_TOKEN" ]; then
    if [ -f /tmp/init.json ]; then
        ROOT_TOKEN=$(cat /tmp/init.json | jq -r '.root_token')
        export VAULT_TOKEN=$ROOT_TOKEN
    fi
fi

echo "✅ Vault is ready!"
echo "🚀 Starting main application..."

# Start the main application
exec npm run serve 
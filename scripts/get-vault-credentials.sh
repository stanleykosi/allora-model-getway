#!/bin/bash

# Script to retrieve Vault credentials from the running container
# This is useful for debugging and verification

echo "🔍 Retrieving Vault credentials from running container..."

# Get the container ID
CONTAINER_ID=$(docker ps --filter "ancestor=allora-mcp" --format "{{.ID}}" | head -1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ No running container found"
    echo "Make sure your application is deployed and running"
    exit 1
fi

echo "📦 Found container: $CONTAINER_ID"

# Get Vault environment variables
echo "🔐 Vault Environment Variables:"
docker exec $CONTAINER_ID cat /tmp/vault-env 2>/dev/null || echo "No vault-env file found"

# Get Vault status
echo ""
echo "📊 Vault Status:"
docker exec $CONTAINER_ID vault status 2>/dev/null || echo "Vault not accessible"

# Get Vault logs
echo ""
echo "📝 Recent Vault Logs:"
docker logs $CONTAINER_ID --tail 50 | grep -i vault || echo "No Vault logs found"

echo ""
echo "✅ Credential retrieval complete!" 
# 🚀 Production Deployment Guide

This guide covers deploying the MCP server to production with HashiCorp Vault integration for secure secret management.

## 📋 Prerequisites

### 1. HashiCorp Vault Setup

#### Install Vault
```bash
# Ubuntu/Debian
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install vault

# Or download from https://www.vaultproject.io/downloads
```

#### Configure Vault
```bash
# Create Vault config
sudo mkdir -p /etc/vault.d
sudo tee /etc/vault.d/vault.hcl <<EOF
storage "file" {
  path = "/opt/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1  # For development only, use TLS in production
}

api_addr = "http://0.0.0.0:8200"
cluster_addr = "https://0.0.0.0:8201"

ui = true
EOF

# Create data directory
sudo mkdir -p /opt/vault/data
sudo chown vault:vault /opt/vault/data

# Start Vault
sudo systemctl enable vault
sudo systemctl start vault
```

#### Initialize Vault
```bash
# Initialize Vault (save the keys and root token securely)
vault operator init

# Unseal Vault (run 3 times with different keys)
vault operator unseal

# Login with root token
vault login
```

#### Create Policies and Tokens
```bash
# Create policy for MCP application
vault policy write mcp-policy -<<EOF
path "secret/data/mcp/*" {
  capabilities = ["create", "read", "update", "delete"]
}

path "secret/metadata/mcp/*" {
  capabilities = ["read", "delete"]
}
EOF

# Create token for MCP application
vault token create -policy=mcp-policy
```

### 2. Environment Variables

Create a `.env.production` file:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/mcp_production

# Allora Network Configuration
ALLORA_CHAIN_ID=allora-testnet-1
ALLORA_RPC_URL=https://rpc.testnet.allora.network/

# Treasury Configuration
TREASURY_MNEMONIC_SECRET_KEY=treasury-mnemonic

# HashiCorp Vault Configuration
VAULT_ADDR=http://your-vault-server:8200
VAULT_TOKEN=your-vault-token
VAULT_NAMESPACE=your-namespace  # Optional
VAULT_SECRET_PATH=secret/data/mcp

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### 3. Database Setup

```bash
# Create production database
createdb mcp_production

# Run migrations
npm run migrate:prod
```

## 🔧 Deployment Steps

### 1. Build the Application

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Test Vault connection
node scripts/setup-vault.js
```

### 2. Store Treasury Mnemonic in Vault

```bash
# Store your treasury mnemonic securely
vault kv put secret/data/mcp/treasury-mnemonic value="your 24 word mnemonic phrase here"
```

### 3. Start the Application

```bash
# Start in production mode
NODE_ENV=production npm start
```

## 🔐 Security Considerations

### 1. Vault Security
- **Use TLS**: Configure Vault with proper TLS certificates
- **Token Rotation**: Regularly rotate Vault tokens
- **Access Control**: Use minimal required permissions
- **Audit Logging**: Enable Vault audit logs

### 2. Application Security
- **Environment Variables**: Never commit secrets to version control
- **Network Security**: Use firewalls to restrict access
- **HTTPS**: Use reverse proxy (nginx) with SSL certificates
- **Rate Limiting**: Implement API rate limiting

### 3. Database Security
- **Connection Encryption**: Use SSL for database connections
- **Access Control**: Restrict database user permissions
- **Backup Encryption**: Encrypt database backups

## 📊 Monitoring and Logging

### 1. Application Monitoring
```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name "mcp-server"

# Monitor logs
pm2 logs mcp-server

# Monitor status
pm2 status
```

### 2. Health Checks
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test Vault connection
curl -X GET http://localhost:3000/api/v1/models/debug \
  -H "X-API-Key: your-api-key"
```

## 🔄 Backup and Recovery

### 1. Database Backup
```bash
# Create backup script
#!/bin/bash
pg_dump mcp_production > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Vault Backup
```bash
# Backup Vault data
sudo systemctl stop vault
sudo tar -czf vault_backup_$(date +%Y%m%d_%H%M%S).tar.gz /opt/vault/data
sudo systemctl start vault
```

## 🚨 Troubleshooting

### Common Issues

1. **Vault Connection Failed**
   ```bash
   # Check Vault status
   vault status
   
   # Test connection
   curl http://your-vault-server:8200/v1/sys/health
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Application Startup Issues**
   ```bash
   # Check logs
   pm2 logs mcp-server
   
   # Restart application
   pm2 restart mcp-server
   ```

## 📈 Scaling Considerations

### 1. Horizontal Scaling
- Use load balancer for multiple instances
- Ensure Redis is shared across instances
- Use external PostgreSQL cluster

### 2. Performance Optimization
- Enable database connection pooling
- Use Redis clustering for high availability
- Implement caching strategies

### 3. High Availability
- Deploy multiple Vault instances
- Use PostgreSQL replication
- Implement health checks and auto-restart

## 🔍 Security Audit Checklist

- [ ] Vault is properly configured with TLS
- [ ] Database connections use SSL
- [ ] Environment variables are secure
- [ ] API keys are properly managed
- [ ] Logs don't contain sensitive data
- [ ] Backup encryption is enabled
- [ ] Access controls are properly configured
- [ ] Monitoring and alerting are set up
- [ ] Incident response plan is documented

## 📞 Support

For issues with production deployment:

1. Check application logs: `pm2 logs mcp-server`
2. Test Vault connection: `node scripts/setup-vault.js`
3. Verify environment variables are set correctly
4. Ensure all services (PostgreSQL, Redis, Vault) are running 
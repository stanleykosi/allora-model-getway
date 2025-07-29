# Use Node.js 22 Alpine for production (required for all packages)
FROM node:22-alpine

# Install allorad CLI tool and Vault
RUN apk add --no-cache curl wget jq && \
    curl -L https://github.com/allora-network/allora-chain/releases/download/v0.12.1/allora-chain_0.12.1_linux_amd64 -o /usr/local/bin/allorad && \
    chmod +x /usr/local/bin/allorad && \
    wget -O /tmp/vault.zip https://releases.hashicorp.com/vault/1.14.0/vault_1.14.0_linux_amd64.zip && \
    unzip /tmp/vault.zip -d /usr/local/bin/ && \
    chmod +x /usr/local/bin/vault && \
    rm /tmp/vault.zip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Copy Vault configuration and startup script
COPY vault-config.hcl /app/vault-config.hcl
COPY start-with-vault.sh /app/start-with-vault.sh
RUN chmod +x /app/start-with-vault.sh

# Build the application (backend + frontend)
RUN npm run build:full

# Verify builds completed successfully
RUN ls -la dist/ && ls -la dist-frontend/ && echo "✅ Build verification complete"

# Remove dev dependencies after build to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Verify static files are still there after cleanup
RUN ls -la dist-frontend/ && echo "✅ Frontend files preserved after cleanup"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application with Vault
CMD ["/app/start-with-vault.sh"] 
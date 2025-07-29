# Use the official HashiCorp Vault image
FROM vault:1.14.0

# Create necessary directories
RUN mkdir -p /vault/logs && \
    mkdir -p /vault/file && \
    mkdir -p /vault/config

# Copy Vault configuration
COPY vault.hcl /vault/config/vault.hcl

# Expose Vault port
EXPOSE 8200

# Set environment variables
ENV VAULT_ADDR=http://0.0.0.0:8200

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8200/v1/sys/health || exit 1

# Start Vault server
CMD ["vault", "server", "-config=/vault/config/vault.hcl"] 
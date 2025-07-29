# Vault configuration for main application container
# This is a development configuration suitable for Railway

# Storage backend - using file storage for simplicity
storage "file" {
  path = "/tmp/vault/file"
}

# HTTP listener
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1  # Disable TLS for Railway deployment
}

# API address
api_addr = "http://0.0.0.0:8200"

# Disable clustering for single instance
disable_clustering = true

# Log level
log_level = "info"

# Default lease TTL
default_lease_ttl = "168h"  # 1 week

# Max lease TTL
max_lease_ttl = "720h"  # 30 days

# UI enabled
ui = true 
# MCP Policy - Updated for wallet mnemonics
path "secret/data/mcp/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/mcp/*" {
  capabilities = ["read", "list"]
}

# Allow access to wallet mnemonics specifically
path "secret/data/mcp/wallet_mnemonic_*" {
  capabilities = ["create", "read", "update", "delete"]
}

path "secret/metadata/mcp/wallet_mnemonic_*" {
  capabilities = ["read", "list"]
}

# Allow access to treasury mnemonic
path "secret/data/mcp/treasury_mnemonic" {
  capabilities = ["create", "read", "update", "delete"]
}

path "secret/metadata/mcp/treasury_mnemonic" {
  capabilities = ["read", "list"]
} 
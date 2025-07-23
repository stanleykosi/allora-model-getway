# Allora MCP Server - Standard MCP Protocol

## Overview

This server now supports **both** approaches:

1. **HTTP REST API** (what we built initially)
2. **Standard MCP Protocol** (proper LLM integration)

## 🎯 **Standard MCP Protocol (Recommended)**

### What is MCP?

The **Model Context Protocol (MCP)** is the standard way LLMs interact with external tools and data sources. It provides:

- **Tool Discovery**: LLMs automatically discover available tools
- **Structured Communication**: Type-safe tool calls and responses
- **No Manual Documentation**: LLMs understand capabilities automatically
- **Better Integration**: Native support in Claude, GPT-4, and other LLMs

### How to Use MCP

#### 1. **With Claude Desktop**
```json
// Add to Claude's MCP configuration
{
  "mcpServers": {
    "allora": {
      "command": "npm",
      "args": ["run", "start:mcp"],
      "cwd": "/path/to/your/allora-mcp"
    }
  }
}
```

#### 2. **With Other MCP Clients**
```bash
# Start the MCP server
npm run start:mcp

# The server will communicate via stdio
# LLMs can discover and use tools automatically
```

### Available MCP Tools

The LLM will automatically discover these tools:

#### 🔍 **get_active_topics**
- **Purpose**: Get all active topics for model registration
- **Input**: None
- **Output**: List of available topics with IDs, names, and details

#### 📝 **register_model**
- **Purpose**: Register a new model for a topic
- **Input**: 
  - `topicId`: Topic ID to register for
  - `modelType`: "inference", "forecaster", or "reputer"
  - `webhookUrl`: Webhook for inference submissions
  - `gasPriceLimit`: Gas price limit (optional)
- **Output**: Registration result with model ID and wallet info

#### 💰 **get_user_wallet_phrases**
- **Purpose**: Get wallet mnemonics for user models
- **Input**: `userId`: User ID to get wallets for
- **Output**: List of wallet phrases for all user models

#### ⚡ **activate_model**
- **Purpose**: Activate a registered model
- **Input**: `modelId`: Model ID to activate
- **Output**: Activation status

#### 🛑 **deactivate_model**
- **Purpose**: Deactivate a registered model
- **Input**: `modelId`: Model ID to deactivate
- **Output**: Deactivation status

#### 📊 **get_topic_details**
- **Purpose**: Get detailed topic information
- **Input**: `topicId`: Topic ID to get details for
- **Output**: Topic details including metadata, epoch length, etc.

#### 🔄 **get_latest_inferences**
- **Purpose**: Get latest network inferences
- **Input**: None
- **Output**: Recent inference submissions

#### 👥 **get_active_workers**
- **Purpose**: Get all active workers on the network
- **Input**: None
- **Output**: List of active inferers, forecasters, and reputers

## 🔄 **HTTP REST API (Alternative)**

If you prefer the HTTP approach, the server still supports it:

### Base URL
```
https://1479d03c6901.ngrok-free.app
```

### Key Endpoints
- `GET /api/v1/predictions/topics` - Get active topics
- `POST /api/v1/models` - Register model
- `GET /api/v1/users/wallet-phrases` - Get wallet phrases
- `PUT /api/v1/models/{id}/activate` - Activate model
- `PUT /api/v1/models/{id}/deactivate` - Deactivate model

## 🚀 **Getting Started**

### Option 1: MCP Protocol (Recommended)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start MCP server**:
   ```bash
   npm run start:mcp
   ```

4. **Connect to LLM**:
   - Add the MCP configuration to your LLM client
   - The LLM will automatically discover and use the tools

### Option 2: HTTP REST API

1. **Start HTTP server**:
   ```bash
   npm start
   ```

2. **Use ngrok for external access**:
   ```bash
   ngrok http 3000
   ```

3. **Share API documentation** with LLMs

## 🔧 **Configuration**

### MCP Configuration
```json
{
  "mcpServers": {
    "allora": {
      "command": "npm",
      "args": ["run", "start:mcp"],
      "cwd": "/path/to/allora-mcp",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ALLORA_RPC_URL=https://...
TREASURY_MNEMONIC_SECRET_KEY=treasury-mnemonic

# Optional (for production)
VAULT_ADDR=http://...
VAULT_TOKEN=...
VAULT_NAMESPACE=...
VAULT_SECRET_PATH=secret/data/mcp
```

## 🎯 **LLM Integration Examples**

### With Claude Desktop
1. Open Claude Desktop
2. Go to Settings → Model Context Protocol
3. Add the MCP configuration
4. Ask Claude: "Show me the available topics on the Allora network"
5. Claude will automatically discover and use the `get_active_topics` tool

### With Other LLMs
- Most modern LLMs support MCP
- The protocol is standardized and well-documented
- Tools are discovered automatically

## 🔒 **Security**

### MCP Protocol
- ✅ **No API keys needed** - LLM authentication handles this
- ✅ **Structured communication** - Type-safe tool calls
- ✅ **Automatic discovery** - No manual documentation sharing

### HTTP REST API
- 🔑 **API key authentication** required
- 📚 **Manual documentation** sharing needed
- 🌐 **External exposure** via ngrok required

## 📊 **Comparison**

| Feature | MCP Protocol | HTTP REST API |
|---------|-------------|---------------|
| **Tool Discovery** | ✅ Automatic | ❌ Manual docs |
| **Type Safety** | ✅ Built-in | ❌ Manual validation |
| **LLM Integration** | ✅ Native | ⚠️ Requires setup |
| **Authentication** | ✅ LLM handles | 🔑 API keys needed |
| **Documentation** | ✅ Auto-generated | 📚 Manual sharing |
| **External Access** | ❌ Local only | ✅ Via ngrok |

## 🎯 **Recommendation**

**Use the MCP Protocol** for the best LLM integration experience. It's the standard way LLMs interact with external tools and provides:

- ✅ **Automatic tool discovery**
- ✅ **Type-safe communication**
- ✅ **Native LLM support**
- ✅ **No manual documentation needed**
- ✅ **Better user experience**

The HTTP REST API is still available as a fallback or for non-LLM integrations. 
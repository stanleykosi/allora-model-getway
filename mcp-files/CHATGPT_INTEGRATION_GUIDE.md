# ChatGPT Integration Guide for Allora MCP Server

## 🌐 **Your Live MCP Server**
**URL**: `https://8a3d259e905d.ngrok-free.app`

## **🤖 How to Use ChatGPT Web with Your MCP Server**

### **Method 1: Direct API Instructions (Recommended)**

**Copy and paste this to ChatGPT:**

```
I have an Allora blockchain MCP server running at https://8a3d259e905d.ngrok-free.app

This server allows users to:
1. Register and get API keys
2. View available blockchain topics (ETH/BTC predictions)
3. Register AI models on the blockchain
4. Retrieve wallet phrases and model information

Available endpoints:
- GET /health - Check server status
- GET /tools - List available tools
- POST /tools/call - Execute tools

Available tools:
1. register_user(email) - Register user and get API key
2. get_active_topics() - Get available blockchain topics
3. register_model(apiKey, topicId, modelType, webhookUrl) - Register model
4. get_user_wallet_phrases(apiKey) - Get wallet phrases
5. get_user_models(apiKey) - Get user's models

Can you help me test this server? Start by checking if it's online.
```

### **Method 2: Step-by-Step Testing**

**Step 1: Health Check**
```
Please make a GET request to https://8a3d259e905d.ngrok-free.app/health to check if the server is online.
```

**Step 2: List Available Tools**
```
Please make a GET request to https://8a3d259e905d.ngrok-free.app/tools to see what tools are available.
```

**Step 3: Get Active Topics**
```
Please make a POST request to https://8a3d259e905d.ngrok-free.app/tools/call with this JSON body:
{
  "name": "get_active_topics",
  "arguments": {}
}
```

**Step 4: Register a User**
```
Please make a POST request to https://8a3d259e905d.ngrok-free.app/tools/call with this JSON body:
{
  "name": "register_user",
  "arguments": {
    "email": "test@example.com"
  }
}
```

### **Method 3: Function Calling (Advanced)**

**Tell ChatGPT:**
```
I have an Allora blockchain MCP server with these functions:

1. register_user(email: string) - Register user and get API key
2. get_active_topics() - Get available blockchain topics  
3. register_model(apiKey: string, topicId: string, modelType: string, webhookUrl: string) - Register model
4. get_user_wallet_phrases(apiKey: string) - Get wallet phrases
5. get_user_models(apiKey: string) - Get user's models

Server URL: https://8a3d259e905d.ngrok-free.app

Can you help me interact with this server using function calling?
```

## **📋 Example ChatGPT Conversation**

### **User:** 
"I have an Allora blockchain MCP server running at https://8a3d259e905d.ngrok-free.app. Can you help me test it?"

### **ChatGPT Response:**
"I'd be happy to help you test your Allora blockchain MCP server! Let me start by checking if the server is online.

Making a GET request to https://8a3d259e905d.ngrok-free.app/health..."

### **User:**
"Great! Now can you get the available topics from the blockchain?"

### **ChatGPT Response:**
"Sure! I'll make a POST request to get the active topics from the Allora blockchain.

Making a POST request to https://8a3d259e905d.ngrok-free.app/tools/call with:
```json
{
  "name": "get_active_topics",
  "arguments": {}
}
```

This should return the available prediction topics like ETH and BTC price predictions."

## **🔧 Technical Details for ChatGPT**

### **Request Format:**
```json
{
  "name": "tool_name",
  "arguments": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

### **Response Format:**
```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "JSON string with results"
      }
    ]
  }
}
```

### **Available Topics:**
- **Topic 1**: ETH 10min Prediction
- **Topic 2**: ETH 24h Prediction  
- **Topic 3**: BTC 10min Prediction
- **Topic 4**: BTC 24h Prediction
- **Topic 7**: ETH 20min Prediction

### **Model Types:**
- `inference` - For making predictions
- `forecaster` - For forecasting models
- `reputer` - For reputation models

## **🚀 Complete Workflow Example**

### **1. Check Server Status**
```bash
curl https://8a3d259e905d.ngrok-free.app/health
```

### **2. Get Available Tools**
```bash
curl https://8a3d259e905d.ngrok-free.app/tools
```

### **3. Get Active Topics**
```bash
curl -X POST https://8a3d259e905d.ngrok-free.app/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name":"get_active_topics","arguments":{}}'
```

### **4. Register User**
```bash
curl -X POST https://8a3d259e905d.ngrok-free.app/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name":"register_user","arguments":{"email":"user@example.com"}}'
```

### **5. Register Model**
```bash
curl -X POST https://8a3d259e905d.ngrok-free.app/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "register_model",
    "arguments": {
      "apiKey": "YOUR_API_KEY",
      "topicId": "1",
      "modelType": "inference",
      "webhookUrl": "https://your-webhook.com"
    }
  }'
```

## **⚠️ Important Notes for ChatGPT**

1. **API Key Security**: Remind users to save their API key securely
2. **Authentication Required**: Most operations need a valid API key
3. **Blockchain Operations**: Model registration involves real blockchain transactions
4. **Webhook URL**: Required for model registration (can be a placeholder for testing)

## **🎯 Quick Start Commands for ChatGPT**

**Copy these commands for ChatGPT:**

```bash
# 1. Health check
curl https://8a3d259e905d.ngrok-free.app/health

# 2. Get tools
curl https://8a3d259e905d.ngrok-free.app/tools

# 3. Get topics
curl -X POST https://8a3d259e905d.ngrok-free.app/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name":"get_active_topics","arguments":{}}'

# 4. Register user
curl -X POST https://8a3d259e905d.ngrok-free.app/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name":"register_user","arguments":{"email":"test@example.com"}}'
```

---

**Your MCP server is now ready for ChatGPT integration!** 🎉 
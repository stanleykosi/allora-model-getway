# Allora MCP Server - User Guide

## 🚨 **CRITICAL SECURITY WARNING**

**⚠️ API KEY SECURITY IS YOUR RESPONSIBILITY**
- **SAVE YOUR API KEY IMMEDIATELY** after user registration
- **Never share your API key** - it's your only access to your models and wallets
- **If you lose your API key**, you cannot recover your models or wallet phrases
- **Store API keys securely** - consider using a password manager

## 📋 **Complete User Workflow**

### **Step 1: User Registration (MANDATORY FIRST STEP)**

**You MUST register a user before doing anything else!**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "register_user",
    "arguments": {
      "email": "your-email@example.com"
    }
  }
}
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "userId": "7c717de6-25f5-4d3d-a16d-6ea838d5c70b",
  "email": "your-email@example.com",
  "apiKey": "c94f1d1a014331f709cc36366085d8d5",
  "note": "SAVE THIS API KEY - it's your only way to access your models and wallets!"
}
```

**⚠️ IMMEDIATELY SAVE YOUR API KEY!**

### **Step 2: Explore Available Topics (No Authentication Required)**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_active_topics",
    "arguments": {}
  }
}
```

### **Step 3: Register Your Model (REQUIRES API KEY)**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "register_model",
    "arguments": {
      "apiKey": "YOUR_SAVED_API_KEY",
      "topicId": "1",
      "modelType": "inference",
      "webhookUrl": "https://your-webhook.com",
      "gasPriceLimit": "0.1"
    }
  }
}
```

**What happens during model registration:**
1. ✅ Validates your API key
2. ✅ Creates a new wallet automatically
3. ✅ Saves wallet mnemonic to secure Vault
4. ✅ Registers model on Allora blockchain
5. ✅ Links model to your user account
6. ✅ Stores everything in PostgreSQL database

### **Step 4: Retrieve Your Wallet Phrases (REQUIRES API KEY)**

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "get_user_wallet_phrases",
    "arguments": {
      "apiKey": "YOUR_SAVED_API_KEY"
    }
  }
}
```

**Expected Response:**
```json
{
  "message": "User wallet phrases retrieved successfully",
  "userId": "7c717de6-25f5-4d3d-a16d-6ea838d5c70b",
  "userEmail": "your-email@example.com",
  "wallets": [
    {
      "model_id": "dcdd026b-3ff3-4ae5-8404-c5b58fabca70",
      "model_type": "inference",
      "topic_id": "1",
      "wallet_id": "642f8d63-d316-4498-b436-8d2fe81266ea",
      "wallet_address": "allo1334zp0h0ddyy6vd5ynfsaff5f6ak8c40czy92v",
      "mnemonic_phrase": "cheap debate excuse under tennis tackle acid whip noise loyal cruel census minute umbrella unaware act strong artefact spike vibrant odor expose lobster scout",
      "created_at": "2025-07-22T07:32:35.236Z"
    }
  ]
}
```

### **Step 5: View Your Models (REQUIRES API KEY)**

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_user_models",
    "arguments": {
      "apiKey": "YOUR_SAVED_API_KEY"
    }
  }
}
```

## 🔒 **Security Best Practices**

### **API Key Management:**
- ✅ **Save immediately** after registration
- ✅ **Store securely** (password manager recommended)
- ✅ **Never share** with anyone
- ✅ **Backup safely** - you can't recover if lost
- ❌ **Don't hardcode** in scripts
- ❌ **Don't commit** to version control

### **Wallet Security:**
- ✅ **Backup mnemonic phrases** securely
- ✅ **Store offline** for maximum security
- ✅ **Use hardware wallets** for large amounts
- ❌ **Never share** mnemonic phrases
- ❌ **Don't store** in plain text files

## 🎯 **Available Topics**

| Topic ID | Name | Epoch Length | Description |
|----------|------|--------------|-------------|
| 1 | ETH 10min Prediction | 120 | Ethereum 10-minute price predictions |
| 2 | ETH 24h Prediction | 17280 | Ethereum 24-hour price predictions |
| 3 | BTC 10min Prediction | 120 | Bitcoin 10-minute price predictions |
| 4 | BTC 24h Prediction | 17280 | Bitcoin 24-hour price predictions |
| 7 | ETH 20min Prediction | 240 | Ethereum 20-minute price predictions |

## 🚀 **Model Types**

| Type | Description |
|------|-------------|
| `inference` | Submit predictions to topics |
| `forecaster` | Submit forecasts to topics |
| `reputer` | Submit reputation scores |

## ⚠️ **Common Errors & Solutions**

### **"User profile not found"**
- **Cause**: Invalid API key or user not registered
- **Solution**: Register a user first and use the correct API key

### **"No models found for this user"**
- **Cause**: No models registered yet
- **Solution**: Register a model first using your API key

### **"Invalid API key"**
- **Cause**: Wrong or expired API key
- **Solution**: Register a new user to get a new API key

### **"Topic not found or is not active"**
- **Cause**: Invalid topic ID
- **Solution**: Use `get_active_topics` to see available topics

## 🔧 **Technical Requirements**

- **Database**: PostgreSQL (Supabase)
- **Secrets**: HashiCorp Vault
- **Blockchain**: Allora Network
- **Authentication**: API Key-based
- **Environment**: Production-ready with SSL

## 📞 **Support**

For technical issues or questions:
- Check this guide first
- Verify your API key is correct
- Ensure you've registered a user first
- Confirm your JSON-RPC format is correct

---

**Remember: Your API key is your digital identity. Keep it safe!** 
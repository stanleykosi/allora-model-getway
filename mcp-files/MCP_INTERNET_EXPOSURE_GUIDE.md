# Exposing Allora MCP Server to Internet

## 🌐 **How to Expose Your MCP Server**

### **Option 1: HTTP MCP Server (Recommended)**

The HTTP MCP server allows remote users to interact with your MCP server via HTTP endpoints.

#### **Start the HTTP MCP Server:**
```bash
npm run start:mcp:http
```

This will start the server on `http://localhost:3000`

#### **Expose to Internet using ngrok:**
```bash
# Install ngrok if not installed
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo 'deb https://ngrok-agent.s3.amazonaws.com buster main' | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Expose your server
ngrok http 3000
```

You'll get a public URL like: `https://abc123.ngrok.io`

### **Option 2: Direct MCP Server (Advanced)**

For direct MCP protocol access, you can expose the stdio-based server:

```bash
# Start the authenticated MCP server
npm run start:mcp:authenticated
```

## 🔧 **HTTP MCP Server Endpoints**

### **Health Check:**
```bash
curl https://your-ngrok-url.ngrok.io/health
```

### **List Available Tools:**
```bash
curl https://your-ngrok-url.ngrok.io/tools
```

### **Register User:**
```bash
curl -X POST https://your-ngrok-url.ngrok.io/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "register_user",
    "arguments": {
      "email": "user@example.com"
    }
  }'
```

### **Get Active Topics:**
```bash
curl -X POST https://your-ngrok-url.ngrok.io/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_active_topics",
    "arguments": {}
  }'
```

### **Register Model:**
```bash
curl -X POST https://your-ngrok-url.ngrok.io/tools/call \
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

### **Get Wallet Phrases:**
```bash
curl -X POST https://your-ngrok-url.ngrok.io/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_user_wallet_phrases",
    "arguments": {
      "apiKey": "YOUR_API_KEY"
    }
  }'
```

## 🤖 **How Remote Users Can Use with LLMs**

### **Option 1: Claude Desktop (Direct MCP)**

1. **Configure Claude Desktop:**
   ```json
   {
     "mcpServers": {
       "allora": {
         "command": "curl",
         "args": ["-s", "https://your-ngrok-url.ngrok.io/tools"],
         "cwd": "/tmp"
       }
     }
   }
   ```

2. **Ask Claude:**
   - "Show me available topics on the Allora network"
   - "Register a user for me"
   - "Register a model for ETH predictions"

### **Option 2: Custom LLM Integration**

#### **Python Example:**
```python
import requests

class AlloraMCPClient:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def register_user(self, email):
        response = requests.post(f"{self.base_url}/tools/call", json={
            "name": "register_user",
            "arguments": {"email": email}
        })
        return response.json()
    
    def get_topics(self):
        response = requests.post(f"{self.base_url}/tools/call", json={
            "name": "get_active_topics",
            "arguments": {}
        })
        return response.json()
    
    def register_model(self, api_key, topic_id, model_type, webhook_url):
        response = requests.post(f"{self.base_url}/tools/call", json={
            "name": "register_model",
            "arguments": {
                "apiKey": api_key,
                "topicId": topic_id,
                "modelType": model_type,
                "webhookUrl": webhook_url
            }
        })
        return response.json()

# Usage
client = AlloraMCPClient("https://your-ngrok-url.ngrok.io")

# Register user
user = client.register_user("user@example.com")
api_key = user["result"]["content"][0]["text"]["apiKey"]

# Get topics
topics = client.get_topics()

# Register model
model = client.register_model(api_key, "1", "inference", "https://webhook.com")
```

#### **JavaScript Example:**
```javascript
class AlloraMCPClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    async registerUser(email) {
        const response = await fetch(`${this.baseUrl}/tools/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'register_user',
                arguments: { email }
            })
        });
        return response.json();
    }
    
    async getTopics() {
        const response = await fetch(`${this.baseUrl}/tools/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'get_active_topics',
                arguments: {}
            })
        });
        return response.json();
    }
    
    async registerModel(apiKey, topicId, modelType, webhookUrl) {
        const response = await fetch(`${this.baseUrl}/tools/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'register_model',
                arguments: { apiKey, topicId, modelType, webhookUrl }
            })
        });
        return response.json();
    }
}

// Usage
const client = new AlloraMCPClient('https://your-ngrok-url.ngrok.io');

// Register user
const user = await client.registerUser('user@example.com');
const apiKey = JSON.parse(user.result.content[0].text).apiKey;

// Get topics
const topics = await client.getTopics();

// Register model
const model = await client.registerModel(apiKey, '1', 'inference', 'https://webhook.com');
```

## 🔒 **Security Considerations for Internet Exposure**

### **✅ Implemented Security:**
- **API Key Authentication** - All sensitive operations require valid API key
- **Input Validation** - All inputs validated before processing
- **Error Sanitization** - No sensitive data leaked in errors
- **HTTPS** - Use ngrok or SSL certificates for encryption

### **⚠️ Additional Security Measures:**
- **Rate Limiting** - Consider adding rate limiting for production
- **CORS** - Configure CORS for web applications
- **API Key Rotation** - Consider implementing key rotation
- **Monitoring** - Monitor for suspicious activity

### **🔧 Production Deployment:**
- **Domain Name** - Use a proper domain instead of ngrok
- **SSL Certificate** - Install proper SSL certificate
- **Load Balancer** - For high traffic
- **Monitoring** - Application and infrastructure monitoring
- **Backup Strategy** - Regular backups of database and secrets

## 📱 **LLM Integration Examples**

### **Claude Desktop Configuration:**
```json
{
  "mcpServers": {
    "allora": {
      "command": "curl",
      "args": ["-s", "https://your-domain.com/tools"],
      "cwd": "/tmp"
    }
  }
}
```

### **GPT-4 Function Calling:**
```javascript
const functions = [
    {
        name: "register_user",
        description: "Register a new user and get API key",
        parameters: {
            type: "object",
            properties: {
                email: {
                    type: "string",
                    description: "User email address"
                }
            },
            required: ["email"]
        }
    },
    {
        name: "get_active_topics",
        description: "Get all active topics",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    },
    {
        name: "register_model",
        description: "Register a model with API key",
        parameters: {
            type: "object",
            properties: {
                apiKey: { type: "string" },
                topicId: { type: "string" },
                modelType: { type: "string", enum: ["inference", "forecaster", "reputer"] },
                webhookUrl: { type: "string" }
            },
            required: ["apiKey", "topicId", "modelType", "webhookUrl"]
        }
    }
];
```

## 🚀 **Quick Start for Remote Users**

1. **Get the public URL** from your ngrok or domain
2. **Test the connection:**
   ```bash
   curl https://your-url.com/health
   ```
3. **Register a user:**
   ```bash
   curl -X POST https://your-url.com/tools/call \
     -H "Content-Type: application/json" \
     -d '{"name":"register_user","arguments":{"email":"test@example.com"}}'
   ```
4. **Use with your preferred LLM** using the examples above

## 📞 **Support**

For issues with internet exposure:
- Check ngrok logs for connection issues
- Verify environment variables are set
- Ensure database and Vault are accessible
- Test with curl before LLM integration

---

**Your MCP server is now ready for remote LLM integration!** 
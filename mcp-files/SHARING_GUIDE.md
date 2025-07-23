# 🚀 **Allora MCP Server - Sharing Guide**

## 📋 **How to Share Your MCP Server with Others**

### **Option 1: Local Network Access (Same Network)**

If the other person is on the same network (same WiFi/LAN):

#### **Step 1: Find Your IP Address**
```bash
# Get your local IP address
ip addr show | grep "inet " | grep -v 127.0.0.1
# or
hostname -I
```

#### **Step 2: Configure Firewall (if needed)**
```bash
# Allow connections to port 3000 (HTTP server)
sudo ufw allow 3000

# Allow MCP server connections (if using TCP)
sudo ufw allow 3001
```

#### **Step 3: Share Configuration**
Send them this configuration:

**For Claude Desktop:**
```json
{
  "mcpServers": {
    "allora": {
      "command": "ssh",
      "args": ["user@YOUR_IP_ADDRESS", "cd /home/stanley/allora-mcp && npm run start:mcp"],
      "cwd": "/home/stanley/allora-mcp"
    }
  }
}
```

**For Cursor IDE:**
```json
{
  "mcpServers": {
    "allora": {
      "command": "ssh",
      "args": ["user@YOUR_IP_ADDRESS", "cd /home/stanley/allora-mcp && npm run start:mcp"],
      "cwd": "/home/stanley/allora-mcp"
    }
  }
}
```

### **Option 2: Internet Access via Ngrok (Recommended)**

#### **Step 1: Install and Configure Ngrok**
```bash
# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Configure your auth token
ngrok config add-authtoken YOUR_AUTHTOKEN
```

#### **Step 2: Expose MCP Server**
```bash
# Expose MCP server via TCP
ngrok tcp 3001

# Or expose HTTP server
ngrok http 3000
```

#### **Step 3: Share Configuration**
Send them the ngrok URL and this configuration:

**For Claude Desktop:**
```json
{
  "mcpServers": {
    "allora": {
      "command": "ssh",
      "args": ["user@YOUR_NGROK_HOST", "cd /home/stanley/allora-mcp && npm run start:mcp"],
      "cwd": "/home/stanley/allora-mcp"
    }
  }
}
```

### **Option 3: Docker Deployment (Production)**

#### **Step 1: Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000 3001

CMD ["npm", "start"]
```

#### **Step 2: Deploy to Cloud**
```bash
# Build and push to registry
docker build -t allora-mcp-server .
docker tag allora-mcp-server your-registry/allora-mcp-server:latest
docker push your-registry/allora-mcp-server:latest
```

#### **Step 3: Share Cloud URL**
Send them the cloud deployment URL and configuration.

### **Option 4: GitHub Repository Sharing**

#### **Step 1: Create Setup Script**
```bash
#!/bin/bash
# setup-mcp.sh

echo "🚀 Setting up Allora MCP Server..."

# Clone repository
git clone https://github.com/your-username/allora-mcp.git
cd allora-mcp

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
echo "Please configure your .env.local file with your settings"

# Start servers
echo "Starting MCP server..."
npm run start:mcp
```

#### **Step 2: Share Repository**
Send them:
1. GitHub repository URL
2. Setup instructions
3. Environment configuration guide

### **Option 5: Web Interface Sharing**

#### **Step 1: Create Web Interface**
```html
<!-- web-interface.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Allora MCP Server</title>
</head>
<body>
    <h1>Allora MCP Server Interface</h1>
    <div id="tools"></div>
    <script>
        // Web interface for MCP server
        // (Implementation details)
    </script>
</body>
</html>
```

#### **Step 2: Share Web URL**
Send them the web interface URL for easy access.

## 🔧 **Required Information to Share**

### **Essential Files**
1. **Environment Configuration** (`.env.local`)
2. **Database Setup** (PostgreSQL)
3. **Vault Configuration** (HashiCorp Vault)
4. **Allora CLI Setup**

### **Configuration Template**
```bash
# .env.local template
DATABASE_URL=postgresql://user:password@localhost:5432/allora_mcp
REDIS_URL=redis://localhost:6379
ALLORA_RPC_URL=https://rpc.allora.network
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=your-vault-token
TREASURY_MNEMONIC_SECRET_KEY=treasury-mnemonic
```

## 📱 **Client Configuration Examples**

### **Claude Desktop**
```json
{
  "mcpServers": {
    "allora": {
      "command": "npm",
      "args": ["run", "start:mcp"],
      "cwd": "/path/to/allora-mcp"
    }
  }
}
```

### **Cursor IDE**
```json
{
  "mcpServers": {
    "allora": {
      "command": "npm",
      "args": ["run", "start:mcp"],
      "cwd": "/path/to/allora-mcp"
    }
  }
}
```

### **Custom MCP Client**
```javascript
// Example MCP client connection
const { Client } = require('@modelcontextprotocol/sdk/client');

const client = new Client({
  name: 'allora-client',
  version: '1.0.0'
});

await client.connect({
  transport: new StdioClientTransport({
    command: 'npm',
    args: ['run', 'start:mcp'],
    cwd: '/path/to/allora-mcp'
  })
});
```

## 🚀 **Quick Start for Others**

### **Step 1: Clone and Setup**
```bash
git clone https://github.com/your-username/allora-mcp.git
cd allora-mcp
npm install
```

### **Step 2: Configure Environment**
```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

### **Step 3: Start Server**
```bash
npm run start:mcp
```

### **Step 4: Configure Client**
Add the MCP server configuration to their LLM client.

## 🔒 **Security Considerations**

### **For Production Sharing**
1. **Use HTTPS** for web interfaces
2. **Implement authentication** for API endpoints
3. **Use VPN** for secure network access
4. **Limit access** to trusted users only
5. **Monitor usage** and logs

### **For Development Sharing**
1. **Use ngrok** for temporary access
2. **Share only with trusted developers**
3. **Use local network** when possible
4. **Keep sensitive data** in environment files

## 📞 **Support Information**

### **Troubleshooting**
- Check server logs: `npm run start:mcp`
- Verify database connection
- Test Vault connectivity
- Check Allora CLI installation

### **Contact Information**
- **Repository**: https://github.com/your-username/allora-mcp
- **Documentation**: README.md
- **Issues**: GitHub Issues
- **Support**: Your contact info

---

**Status**: ✅ **Ready for Sharing**
**Last Updated**: 2025-07-21
**Version**: 1.0.0 
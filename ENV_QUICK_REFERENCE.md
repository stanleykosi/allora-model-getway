# 🔧 Environment Variables Quick Reference

> Quick setup guide for Model Gateway environment variables

## 🚀 **Quick Setup (5 minutes)**

1. **Copy template**: `cp env.example.template .env.local`
2. **Fill required variables** (marked with ⭐ below)
3. **Start development**: `npm run start:dev`

## ⭐ **Required Variables (Must Set)**

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `ALLORA_API_URLS` | `https://api1,https://api2` | Allora Network API endpoints |
| `ALLORA_RPC_URLS` | `https://rpc1,https://rpc2` | Allora Network RPC endpoints |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Clerk frontend key |
| `CLERK_SECRET_KEY` | `sk_test_...` | Clerk backend secret |
| `TREASURY_MNEMONIC_SECRET_KEY` | `your_secret_key` | Treasury wallet secret |

## 🔧 **Optional Variables (Defaults Provided)**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `CHAIN_ID` | `allora-testnet-1` | Allora network chain ID |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `JOB_CONCURRENCY` | `5` | Concurrent job processing |

## 🏗️ **Development vs Production**

### **Development (.env.local)**
```bash
NODE_ENV=development
LOG_LEVEL=debug
ALLOWED_ORIGINS=http://localhost:3000
VAULT_ADDR=http://127.0.0.1:8200
```

### **Production (Railway)**
```bash
NODE_ENV=production
LOG_LEVEL=info
ALLOWED_ORIGINS=https://your-app.railway.app
VAULT_ADDR=https://vault.railway.app
```

## 🔐 **Authentication Setup**

1. **Create Clerk account** at [clerk.com](https://clerk.com)
2. **Create new application**
3. **Copy keys** to your `.env.local`:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

## 🗄️ **Database Setup**

### **Local PostgreSQL**
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb model_gateway

# Set DATABASE_URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/model_gateway"
```

### **Supabase (Recommended)**
1. Create project at [supabase.com](https://supabase.com)
2. Copy connection string to `DATABASE_URL`
3. Enable TimescaleDB extension

## 📡 **Redis Setup**

### **Local Redis**
```bash
# Install Redis
sudo apt install redis-server

# Start Redis
sudo systemctl start redis

# Set REDIS_URL
REDIS_URL="redis://localhost:6379"
```

### **Railway Redis**
- Railway automatically provides Redis
- URL format: `redis://default:password@gondola.proxy.rlwy.net:port`

## 🔑 **Vault Setup (Optional)**

### **Local Development**
```bash
# Install Vault
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
unzip vault_1.15.0_linux_amd64.zip
sudo mv vault /usr/local/bin/

# Start Vault
vault server -dev

# Set variables
VAULT_ADDR="http://127.0.0.1:8200"
VAULT_TOKEN="your_dev_token"
```

### **Production (Railway)**
- Railway provides managed Vault
- Set `VAULT_ADDR` to Railway Vault URL
- Use Railway Vault token

## 🧪 **Testing Variables**

```bash
# Enable test mode
DRY_RUN_TRANSACTIONS=true

# Test worker
WORKER_MNEMONIC="your_test_mnemonic"
MODEL_ID="test_model_id"

# Bypass checks (development only)
JOBS_BYPASS_CAN_SUBMIT=true
```

## 🚨 **Common Issues & Solutions**

### **"Invalid environment variables" Error**
- Check `src/config/index.ts` for required variables
- Ensure all required variables are set
- Verify variable formats (URLs, numbers, booleans)

### **Database Connection Failed**
- Verify `DATABASE_URL` format
- Check PostgreSQL service status
- Ensure database exists and is accessible

### **Redis Connection Failed**
- Verify `REDIS_URL` format
- Check Redis service status
- Ensure Redis is running on specified port

### **Clerk Authentication Issues**
- Verify Clerk keys are correct
- Check Clerk application settings
- Ensure CORS origins are configured

## 📋 **Environment Checklist**

- [ ] Database connection string
- [ ] Redis connection string
- [ ] Allora Network endpoints
- [ ] Clerk authentication keys
- [ ] Treasury secret key
- [ ] Vault configuration (if using)
- [ ] CORS origins
- [ ] Rate limiting settings
- [ ] Job processing settings

## 🔗 **Related Files**

- **Main README**: `README.md`
- **Railway Deployment**: `RAILWAY_DEPLOYMENT.md`
- **Config Schema**: `src/config/index.ts`
- **Environment Template**: `env.example.template`

---

**💡 Tip**: Use `npm run build` to validate your environment variables before starting the server!

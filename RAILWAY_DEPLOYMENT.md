# 🚂 Railway Deployment Guide

## 📋 Pre-Deployment Checklist

✅ **Dockerfile** - Verified and aligned with project structure  
✅ **railway.json** - Configuration is correct  
✅ **Build Process** - `npm run build:full` works successfully  
✅ **Health Endpoint** - `/health` endpoint implemented  
✅ **Environment Variables** - Config schema updated  

## 🚀 Deployment Steps

### 1. Login to Railway
```bash
railway login
```

### 2. Link to Project (if not already linked)
```bash
railway link
```

### 3. Deploy to Railway
```bash
railway up
```

## 🔧 Environment Variables Setup

After deployment, you'll need to set these environment variables in Railway:

### Core Application
- `NODE_ENV=production`
- `PORT=3000`

### Database
- `DATABASE_URL` - Your PostgreSQL connection string
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

### Redis
- `REDIS_URL` - Your Redis connection string

### Allora Network
- `ALLORA_API_URLS` - Comma-separated API URLs
- `ALLORA_RPC_URLS` - Comma-separated RPC URLs
- `CHAIN_ID` - Default: allora-testnet-1
- `AVERAGE_BLOCK_TIME_SECONDS` - Default: 5

### Authentication (Clerk)
- `VITE_CLERK_PUBLISHABLE_KEY` - Frontend Clerk key
- `CLERK_SECRET_KEY` - Backend Clerk secret

### Secrets Management
- `TREASURY_MNEMONIC_SECRET_KEY` - Treasury wallet mnemonic
- `VAULT_ADDR` - HashiCorp Vault address (optional)
- `VAULT_TOKEN` - Vault authentication token (optional)
- `VAULT_NAMESPACE` - Vault namespace (optional)
- `VAULT_SECRET_PATH` - Default: secret/data/mcp

### Security & Rate Limiting
- `ALLOWED_ORIGINS` - CORS allowed origins
- `RATE_LIMIT_WINDOW_MS` - Default: 900000 (15 minutes)
- `RATE_LIMIT_MAX` - Default: 100 requests per window

### Worker Configuration
- `BOUNDED_EXP40DEC_PRECISION` - Default: 18
- `INVALID_MODEL_OUTPUT_POLICY` - Default: throw
- `JOB_CONCURRENCY` - Default: 5
- `JOB_RATE_MAX` - Default: 100
- `JOB_RATE_DURATION` - Default: 10000

### Model Management
- `ACTIVE_TOPICS_SCAN_START_ID` - Default: 1
- `ACTIVE_TOPICS_SCAN_END_ID` - Default: 100
- `ACTIVE_TOPICS_CACHE_MS` - Default: 60000
- `ACTIVE_TOPICS_FALLBACK_SCAN` - Default: true

### Transaction & Broadcasting
- `SUBMISSION_FIXED_GAS_LIMIT` - Default: 180000
- `JOBS_FAST_BROADCAST` - Default: false
- `JOBS_BYPASS_CAN_SUBMIT` - Default: false
- `DRY_RUN_TRANSACTIONS` - Default: false

### Wallet Management
- `REG_FEE_SAFETY_MULTIPLIER` - Default: 1.3
- `ENABLE_PREFLIGHT_BALANCE_CHECK` - Default: true
- `MIN_WALLET_BALANCE_UALLO` - Default: 20000
- `TOPUP_AMOUNT_UALLO` - Default: 50000

### Monitoring & Health
- `ENABLE_NODE_HEALTH_MONITOR` - Default: true
- `NODE_HEALTH_CHECK_MS` - Default: 30000
- `NODE_HEALTH_MAX_FAILS` - Default: 2
- `METRICS_TOKEN` - Optional metrics protection token

### Development & Testing
- `WORKER_MNEMONIC` - Optional for testing
- `MODEL_ID` - Optional for testing

## 🔍 Post-Deployment Verification

### 1. Check Deployment Status
```bash
railway status
```

### 2. View Logs
```bash
railway logs
```

### 3. Test Health Endpoint
```bash
curl https://your-app.railway.app/health
```

### 4. Monitor Application
```bash
railway open
```

## 🚨 Troubleshooting

### Build Issues
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (22.x)
- Check for TypeScript compilation errors

### Runtime Issues
- Verify all required environment variables are set
- Check database and Redis connectivity
- Monitor application logs for errors

### Health Check Failures
- Ensure `/health` endpoint is accessible
- Check if application is binding to correct port
- Verify internal service dependencies

## 📊 Monitoring & Maintenance

- **Health Checks**: Automatic every 30 seconds
- **Restart Policy**: ON_FAILURE with max 3 retries
- **Logs**: Available via Railway dashboard and CLI
- **Metrics**: Available at `/metrics` endpoint (if token protected)

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to your linked Git repository. Ensure your `railway.json` and `Dockerfile` remain aligned with your project structure.

# 🚀 Model Gateway - Allora Network Integration

> **Model Gateway** is a comprehensive HTTP server that simplifies participation of Data Scientists on the Allora Network. It provides a modern web interface for managing AI/ML models, wallets, and blockchain interactions.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)

## 🌟 Overview

Model Gateway serves as a bridge between AI/ML practitioners and the Allora Network blockchain. It provides:

- **Model Management**: Register, activate, and manage AI models on the blockchain
- **Wallet Management**: Secure wallet creation and management with HashiCorp Vault
- **Blockchain Integration**: Seamless interaction with Allora Network testnet/mainnet
- **Modern Web UI**: React-based interface with real-time updates
- **Job Queue System**: Redis-powered job processing for blockchain operations
- **Authentication**: Clerk-based user authentication and authorization

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Express API   │    │ • Allora Network│
│ • Model Mgmt    │    │ • Job Queue     │    │ • HashiCorp Vault│
│ • Wallet Mgmt   │    │ • PostgreSQL    │    │ • Clerk Auth    │
│ • Real-time UI  │    │ • Redis         │    │ • Supabase      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js 22 + Express + TypeScript
- **Database**: PostgreSQL with TimescaleDB extension
- **Cache/Queue**: Redis with BullMQ
- **Authentication**: Clerk (frontend + backend)
- **Secrets**: HashiCorp Vault
- **Blockchain**: Allora Network integration

## ✨ Features

### 🔐 Authentication & Security
- Clerk-based user authentication
- Role-based access control
- HashiCorp Vault integration for secrets
- Rate limiting and CORS protection
- Helmet.js security headers

### 🤖 Model Management
- AI/ML model registration on blockchain
- Model activation/deactivation
- Performance monitoring
- Topic-based model discovery

### 💰 Wallet Management
- Secure wallet creation
- Balance monitoring
- Automatic top-up system
- Transaction history

### 📊 Dashboard & Monitoring
- Real-time model statistics
- Wallet balance tracking
- Job queue monitoring
- Health checks and metrics

### 🔄 Job Processing
- Redis-based job queue
- Background blockchain operations
- Retry mechanisms
- Concurrent job processing

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Query** - Data fetching
- **React Router** - Navigation
- **Lucide React** - Icons

### Backend
- **Node.js 22** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Redis** - Cache & queue
- **BullMQ** - Job processing
- **Pino** - Logging
- **Zod** - Validation

### Infrastructure
- **Docker** - Containerization
- **Railway** - Deployment platform
- **HashiCorp Vault** - Secrets management
- **Clerk** - Authentication service

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 22.x** (LTS recommended)
- **npm 10.x** or **yarn**
- **PostgreSQL 15+** with TimescaleDB extension
- **Redis 7+**
- **Git**

### Optional Dependencies
- **Docker** - For containerized development
- **Protobuf compiler** - For protocol buffer generation
- **Railway CLI** - For deployment

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd allora-mcp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template and configure your variables:

```bash
cp env.example.template .env.local
# Edit .env.local with your configuration
```

### 4. Database Setup

```bash
# Create database and run migrations
npm run migrate:rls
```

### 5. Start Development Servers

```bash
# Terminal 1: Backend development
npm run start:dev

# Terminal 2: Frontend development
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🧪 Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start backend in development mode
npm run dev                # Start frontend development server
npm run build:full         # Build both backend and frontend
npm run test               # Run test suite

# Database & Security
npm run migrate:rls        # Apply Row Level Security policies
npm run setup:security     # Setup security policies
npm run clear-queue        # Clear Redis job queue

# Production
npm run serve              # Start production server
npm run start:clean        # Start with clean queue
```

### Project Structure

```
allora-mcp/
├── src/                   # Backend source code
│   ├── api/              # Express routes & controllers
│   ├── config/           # Configuration & environment
│   ├── core/             # Core business logic
│   ├── generated/        # Protocol buffer generated code
│   ├── persistence/      # Database models & migrations
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── src-frontend/         # Frontend source code
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # React contexts
│   └── lib/             # Frontend utilities
├── scripts/              # Utility scripts
├── proto/                # Protocol buffer definitions
├── docs/                 # Documentation
└── dist/                 # Build outputs
```

### Code Quality

- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Prettier** - Code formatting
- **Jest** - Testing framework

## 🔧 Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Redis
REDIS_URL="redis://localhost:6379"

# Allora Network
ALLORA_API_URLS="https://api1,https://api2"
ALLORA_RPC_URLS="https://rpc1,https://rpc2"
CHAIN_ID="allora-testnet-1"

# Authentication
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Secrets
TREASURY_MNEMONIC_SECRET_KEY="your_secret_key"
```

### Optional Variables

```bash
# Vault Configuration
VAULT_ADDR="http://localhost:8200"
VAULT_TOKEN="your_vault_token"
VAULT_SECRET_PATH="secret/data/mcp"

# Security
ALLOWED_ORIGINS="http://localhost:3000"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Job Processing
JOB_CONCURRENCY=5
JOB_RATE_MAX=100
JOB_RATE_DURATION=10000
```

See `env.example.template` for complete configuration options.

## 🚀 Deployment

### Railway Deployment (Recommended)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Link**
   ```bash
   railway login
   railway link
   ```

3. **Set Environment Variables**
   ```bash
   railway variables --set "KEY=value"
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Docker Deployment

1. **Build Image**
   ```bash
   docker build -t model-gateway .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 --env-file .env.local model-gateway
   ```

### Manual Deployment

1. **Build Application**
   ```bash
   npm run build:full
   ```

2. **Start Production Server**
   ```bash
   npm run serve
   ```

## 📚 API Documentation

### Core Endpoints

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics (optional auth)
- `GET /api/v1/models` - Model management
- `GET /api/v1/users` - User management
- `GET /api/v1/predictions` - Prediction handling
- `GET /api/v1/submissions` - Submission management

### Authentication

All API endpoints (except `/health`) require authentication via Clerk JWT tokens.

### Rate Limiting

- **General**: 100 requests per 15 minutes
- **Auth endpoints**: Stricter limits applied

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- Follow TypeScript best practices
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed
- Follow the existing code style

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test.spec.ts
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npm run build
```

#### Database Connection Issues
```bash
# Verify DATABASE_URL format
# Check PostgreSQL service status
# Verify SSL configuration
```

#### Redis Connection Issues
```bash
# Check Redis service status
# Verify REDIS_URL format
# Check firewall settings
```

#### Authentication Issues
```bash
# Verify Clerk keys
# Check CORS configuration
# Verify JWT token validity
```

### Health Checks

- **Application**: `GET /health`
- **Database**: Check connection logs
- **Redis**: Check queue status
- **Vault**: Verify token validity

### Logs

- **Development**: Console output with pino-pretty
- **Production**: Structured JSON logs
- **Railway**: Available via dashboard and CLI

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🆘 Support

For support and questions:

- **Issues**: Create a GitHub issue
- **Documentation**: Check the `/docs` folder
- **Configuration**: Review `src/config/index.ts`
- **Deployment**: See `RAILWAY_DEPLOYMENT.md`

---

**Built with ❤️ by the Model Gateway Team**
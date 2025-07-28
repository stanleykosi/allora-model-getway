# Use Node.js 22 Alpine for production (required for all packages)
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (backend + frontend)
RUN npm run build:full

# Verify builds completed successfully
RUN ls -la dist/ && ls -la dist-frontend/ && echo "✅ Build verification complete"

# Remove dev dependencies after build to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Verify static files are still there after cleanup
RUN ls -la dist-frontend/ && echo "✅ Frontend files preserved after cleanup"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "run", "serve"] 
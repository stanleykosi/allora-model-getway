/**
 * @description
 * This file sets up the Express server application. It includes the core
 * server configuration, middleware, and a basic health check route.
 * This setup modularizes the server instance, making it easy to import
 * for testing or to start from the main application entry point.
 *
 * @dependencies
 * - express: The web framework for Node.js.
 * - pino-http: Middleware for logging HTTP requests using the pino logger.
 * - @/utils/logger: The application's structured logger instance.
 * - @/api/v1/models/models.routes: The router for model-related endpoints.
 *
 * @notes
 * - CORS middleware is not yet added but will be necessary for a web-based client.
 * - This file defines the server but does not start it. The starting logic
 *   is handled in `src/index.ts`.
 */

import express, { Express, Request, Response } from 'express';
import pinoHttp from 'pino-http';
import path from 'path';
import logger from '@/utils/logger';
import modelRoutes from '@/api/v1/models/models.routes';
import userRoutes from '@/api/v1/users/users.routes';
import predictionRoutes from '@/api/v1/predictions/predictions.routes';

// Create the Express application instance.
const app: Express = express();

// --- Global Middleware ---

// Add CORS middleware to allow frontend requests
app.use((req, res, next) => {
  // Allow both Vite dev server and same-origin requests
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Same-origin requests (when frontend is served by Express)
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Use pino-http for structured, efficient request logging.
// This middleware will log every incoming request and its response.
app.use(pinoHttp({
  // Customize HTTP request logging for better readability
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    }
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  // Customize the log message format
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err?.message || 'Unknown error'}`;
  },
  // Ignore health check requests to reduce noise
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
}));

// Use express.json() to parse incoming requests with JSON payloads.
// This is essential for handling POST/PUT requests for the API.
app.use(express.json());

// --- Health Check Route ---

/**
 * @route GET /health
 * @description
 * A simple health check endpoint to verify that the server is up and running.
 * It's a standard practice for load balancers and monitoring systems.
 * @returns {object} 200 - A JSON object with a status message.
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// --- API Routers ---
// Wire up the versioned API routes for the 'models' resource.
app.use('/api/v1/models', modelRoutes);

// Wire up the versioned API routes for the 'users' resource.
app.use('/api/v1/users', userRoutes);

// Wire up the versioned API routes for the 'predictions' resource.
app.use('/api/v1/predictions', predictionRoutes);

// --- Frontend Static Files ---
// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../../dist-frontend')));

// Serve the logo and other public assets
app.use(express.static(path.join(__dirname, '../../public')));

// --- Frontend Routing ---
// Handle all non-API routes by serving the frontend application
// This enables client-side routing for the React application
app.get('*', (req: Request, res: Response) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Serve the frontend application for all other routes
  res.sendFile(path.join(__dirname, '../../dist-frontend/index.html'));
});

export default app; 
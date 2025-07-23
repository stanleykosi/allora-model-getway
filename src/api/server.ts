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
import logger from '@/utils/logger';
import modelRoutes from '@/api/v1/models/models.routes';
import userRoutes from '@/api/v1/users/users.routes';
import predictionRoutes from '@/api/v1/predictions/predictions.routes';

// Create the Express application instance.
const app: Express = express();

// --- Global Middleware ---

// Use pino-http for structured, efficient request logging.
// This middleware will log every incoming request and its response.
app.use(pinoHttp());

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


export default app; 
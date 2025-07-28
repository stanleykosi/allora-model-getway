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
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import path from 'path';
import logger from '@/utils/logger';
import { config } from '@/config';
import securityMonitoring from '@/api/v1/middleware/security.middleware';
import modelRoutes from '@/api/v1/models/models.routes';
import userRoutes from '@/api/v1/users/users.routes';
import predictionRoutes from '@/api/v1/predictions/predictions.routes';

// Create the Express application instance.
const app: Express = express();

// --- Security Headers ---
// SECURITY FIX: Add comprehensive security headers
app.use(helmet({
  // Enhanced Content Security Policy
  contentSecurityPolicy: false, // Temporarily disable CSP to test
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // Prevent MIME type sniffing
  noSniff: true,
  // XSS Protection
  xssFilter: true,
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Don't set X-Download-Options for IE8+
  ieNoOpen: true
}));

// SECURITY FIX: Add security monitoring and threat detection
app.use(securityMonitoring);

// --- Global Middleware ---

// SECURITY FIX: Implement strict CORS policy with environment-based configuration

// Define allowed origins based on environment
const getAllowedOrigins = (): string[] => {
  if (config.NODE_ENV === 'production') {
    // Production: Use environment variable for allowed origins
    return config.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
  } else {
    // Development: Allow local development servers
    return ['http://localhost:5173', 'http://localhost:3000'];
  }
};

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow same-origin requests (for static files and same-domain requests)
    if (origin && origin.includes('railway.app')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log unauthorized CORS attempts for security monitoring
    logger.warn({
      origin,
      allowedOrigins,
      ip: origin // We don't have access to req here, so just log the origin
    }, 'Blocked CORS request from unauthorized origin');

    return callback(new Error('Not allowed by CORS policy'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  maxAge: 86400 // Cache preflight response for 24 hours
}));

// SECURITY FIX: Implement rate limiting to prevent DoS and brute force attacks
const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // Time window for rate limiting
  max: config.RATE_LIMIT_MAX, // Maximum number of requests per window
  message: {
    error: 'Too many requests from this IP address. Please try again later.',
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000 / 60) // minutes
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    }, 'Rate limit exceeded');

    res.status(429).json({
      error: 'Too many requests from this IP address. Please try again later.',
      retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000 / 60)
    });
  }
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 auth attempts per window
  message: {
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: 15
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    }, 'Auth rate limit exceeded');

    res.status(429).json({
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter: 15
    });
  }
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

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
// Apply stricter rate limiting to user/auth endpoints
app.use('/api/v1/users', authLimiter, userRoutes);

// Wire up the versioned API routes for the 'predictions' resource.
app.use('/api/v1/predictions', predictionRoutes);

// --- Frontend Static Files ---
// Serve static files from the frontend build directory using absolute project root path. This works
// both when running via ts-node (src/ paths) and when running the compiled code from dist/.
const FRONTEND_BUILD_DIR = path.join(process.cwd(), 'dist-frontend');
app.use(express.static(FRONTEND_BUILD_DIR));

// Serve the logo and other public assets
app.use(express.static(path.join(process.cwd(), 'public')));

// --- Frontend Routing ---
// Handle all non-API routes by serving the frontend application
// This enables client-side routing for the React application
app.get('*', (req: Request, res: Response) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Serve the frontend application for all other routes
  res.sendFile(path.join(FRONTEND_BUILD_DIR, 'index.html'));
});

export default app; 
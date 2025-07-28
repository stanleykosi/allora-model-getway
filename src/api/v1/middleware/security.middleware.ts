/**
 * @description
 * Security monitoring middleware for tracking and logging security events.
 * This middleware helps detect and respond to potential security threats.
 *
 * @dependencies
 * - express: For handling HTTP requests and responses.
 * - @/utils/logger: The application's structured logger.
 * - @/config: For accessing configuration values.
 */

import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';
import { config } from '@/config';

// Extend the Express Request interface to include security context
declare global {
  namespace Express {
    interface Request {
      securityContext?: {
        suspiciousActivity?: boolean;
        riskLevel?: 'low' | 'medium' | 'high';
        threats?: string[];
      };
    }
  }
}

/**
 * Security event types for monitoring
 */
export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'auth_failure',
  AUTHORIZATION_FAILURE = 'authz_failure',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  MALFORMED_REQUEST = 'malformed_request',
  POTENTIAL_INJECTION = 'potential_injection',
  CORS_VIOLATION = 'cors_violation',
  INVALID_TOKEN = 'invalid_token'
}

/**
 * Security monitoring middleware
 */
export const securityMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Initialize security context
  req.securityContext = {
    suspiciousActivity: false,
    riskLevel: 'low',
    threats: []
  };

  // Check for suspicious patterns in the request
  const suspiciousPatterns = [
    // SQL injection patterns
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    // XSS patterns
    /(<script|javascript:|vbscript:|onload=|onerror=|onclick=)/i,
    // Path traversal
    /(\.\.|\/\.\.|\\\.\.)/,
    // Command injection
    /(\b(eval|exec|system|shell_exec|passthru)\b)/i
  ];

  const requestContent = JSON.stringify({
    url: req.url,
    query: req.query,
    body: req.body,
    headers: req.headers
  });

  // Detect suspicious patterns
  const detectedThreats: string[] = [];
  suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(requestContent)) {
      switch (index) {
        case 0:
          detectedThreats.push('SQL_INJECTION');
          break;
        case 1:
          detectedThreats.push('XSS_ATTEMPT');
          break;
        case 2:
          detectedThreats.push('PATH_TRAVERSAL');
          break;
        case 3:
          detectedThreats.push('COMMAND_INJECTION');
          break;
      }
    }
  });

  // Update security context if threats detected
  if (detectedThreats.length > 0) {
    req.securityContext.suspiciousActivity = true;
    req.securityContext.riskLevel = detectedThreats.length > 2 ? 'high' : 'medium';
    req.securityContext.threats = detectedThreats;

    // Log security threat
    logSecurityEvent(SecurityEventType.SUSPICIOUS_REQUEST, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      threats: detectedThreats,
      riskLevel: req.securityContext.riskLevel
    });
  }

  // Monitor response for security events
  const originalSend = res.send;
  res.send = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    // Log slow requests that might indicate DoS attempts
    if (responseTime > 5000) {
      logSecurityEvent(SecurityEventType.SUSPICIOUS_REQUEST, {
        ip: req.ip,
        url: req.url,
        responseTime,
        reason: 'SLOW_RESPONSE'
      });
    }

    // Log authentication failures
    if (res.statusCode === 401) {
      logSecurityEvent(SecurityEventType.AUTHENTICATION_FAILURE, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method
      });
    }

    // Log authorization failures
    if (res.statusCode === 403) {
      logSecurityEvent(SecurityEventType.AUTHORIZATION_FAILURE, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Log security events with structured data
 */
export const logSecurityEvent = (eventType: SecurityEventType, data: any): void => {
  const securityLog = logger.child({ 
    component: 'SECURITY_MONITOR',
    eventType,
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });

  switch (eventType) {
    case SecurityEventType.AUTHENTICATION_FAILURE:
    case SecurityEventType.AUTHORIZATION_FAILURE:
    case SecurityEventType.SUSPICIOUS_REQUEST:
    case SecurityEventType.POTENTIAL_INJECTION:
      securityLog.warn(data, `Security event: ${eventType}`);
      break;
    case SecurityEventType.RATE_LIMIT_EXCEEDED:
    case SecurityEventType.CORS_VIOLATION:
      securityLog.info(data, `Security event: ${eventType}`);
      break;
    default:
      securityLog.debug(data, `Security event: ${eventType}`);
  }

  // In production, you could also send alerts to external monitoring systems
  if (config.NODE_ENV === 'production' && 
      [SecurityEventType.SUSPICIOUS_REQUEST, SecurityEventType.POTENTIAL_INJECTION].includes(eventType)) {
    // TODO: Integrate with alerting system (e.g., PagerDuty, Slack, etc.)
    console.warn(`HIGH PRIORITY SECURITY ALERT: ${eventType}`, data);
  }
};

/**
 * Middleware to log successful authentication events
 */
export const logAuthSuccess = (userId: string, email: string, req: Request): void => {
  logger.info({
    component: 'SECURITY_MONITOR',
    eventType: 'AUTH_SUCCESS',
    userId,
    email,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  }, 'Successful authentication');
};

export default securityMonitoring; 
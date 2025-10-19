/**
 * Security Middleware
 * Production-ready security measures
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const validator = require('validator');
const xss = require('xss');
const config = require('../config/environment');
const { securityLogger } = require('../config/logger');

// Helmet configuration for security headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      securityLogger('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      });
      
      res.status(429).json({
        error: 'Too many requests',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// General API rate limiting
const apiRateLimit = createRateLimit(
  config.RATE_LIMIT.WINDOW_MS,
  config.RATE_LIMIT.MAX_REQUESTS,
  'API rate limit exceeded'
);

// Strict rate limiting for authentication endpoints
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts'
);

// File upload rate limiting
const uploadRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Too many file uploads'
);

// CORS configuration
const corsConfig = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      config.SECURITY.CORS_ORIGIN,
      'http://localhost:3001',
      'http://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      securityLogger('CORS blocked', {
        origin,
        allowedOrigins
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return xss(validator.escape(obj.trim()));
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// SQL injection prevention
const preventSQLInjection = (req, res, next) => {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/gi,
    /(\b(OR|AND)\s+".*"\s*=\s*".*")/gi,
    /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi
  ];

  const checkForSQLInjection = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(value)) {
            securityLogger('SQL injection attempt detected', {
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              endpoint: req.path,
              method: req.method,
              suspiciousInput: value,
              pattern: pattern.toString()
            });
            
            return res.status(400).json({
              error: 'Invalid input detected',
              message: 'Suspicious input pattern detected'
            });
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        const result = checkForSQLInjection(value);
        if (result) return result;
      }
    }
    return null;
  };

  const result = checkForSQLInjection({ ...req.body, ...req.query, ...req.params });
  if (result) return result;
  
  next();
};

// Request size limiting
const requestSizeLimit = (maxSize) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSize) {
      securityLogger('Request size limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentLength,
        maxSize,
        endpoint: req.path
      });
      
      return res.status(413).json({
        error: 'Request too large',
        message: `Request size exceeds ${maxSize} bytes`
      });
    }
    
    next();
  };
};

// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      securityLogger('IP whitelist violation', {
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        endpoint: req.path
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'IP address not authorized'
      });
    }
    
    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

module.exports = {
  helmetConfig,
  corsConfig,
  apiRateLimit,
  authRateLimit,
  uploadRateLimit,
  sanitizeInput,
  preventSQLInjection,
  requestSizeLimit,
  ipWhitelist,
  securityHeaders
};

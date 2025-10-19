/**
 * Structured Logging Configuration
 * Production-ready logging with Winston
 */

const winston = require('winston');
const path = require('path');

// Simple config for logging without strict environment validation
const config = {
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    FILE_PATH: process.env.LOG_FILE_PATH || './logs/app.log'
  }
};

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.LOGGING.LEVEL,
  format: logFormat,
  defaultMeta: {
    service: 'hals-penny',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(config.LOGGING.FILE_PATH),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Separate error log file
    new winston.transports.File({
      filename: path.join('./logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join('./logs/exceptions.log')
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('./logs/rejections.log')
    })
  ]
});

// Add request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.uid || 'anonymous'
    });
  });
  
  next();
};

// Add error logging middleware
const errorLogger = (error, req, res, next) => {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.uid || 'anonymous'
  });
  
  next(error);
};

// Performance monitoring
const performanceLogger = (operation, duration, metadata = {}) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Security event logging
const securityLogger = (event, details) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Business logic logging
const businessLogger = (action, entity, details = {}) => {
  logger.info('Business Event', {
    action,
    entity,
    ...details
  });
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  performanceLogger,
  securityLogger,
  businessLogger
};

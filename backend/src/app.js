/**
 * Production Application
 * Main application entry point with proper structure and security
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Import configuration and middleware
const config = require('./config/environment');
const { logger, requestLogger, errorLogger } = require('./config/logger');
const {
  helmetConfig,
  corsConfig,
  apiRateLimit,
  authRateLimit,
  sanitizeInput,
  preventSQLInjection,
  securityHeaders
} = require('./middleware/security');

// Import database and routes
const Database = require('../database');
const createExpenseRoutes = require('./routes/expense-routes');

class Application {
  constructor() {
    this.app = express();
    this.database = new Database();
    this.logger = logger.child({ component: 'Application' });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup application middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmetConfig);
    this.app.use(corsConfig);
    this.app.use(securityHeaders);
    
    // Compression
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use(requestLogger);
    
    // Input sanitization
    this.app.use(sanitizeInput);
    this.app.use(preventSQLInjection);
    
    // Rate limiting
    this.app.use(apiRateLimit);
    
    // Static files
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    this.logger.info('Middleware configured successfully');
  }

  /**
   * Setup application routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.NODE_ENV
      });
    });

    // API documentation
    try {
      const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
      this.logger.info('API documentation available at /api-docs');
    } catch (error) {
      this.logger.warn('Failed to load API documentation', { error: error.message });
    }

    // API routes
    this.app.use('/api/expenses', createExpenseRoutes(this.database));
    
    // Catch-all route for SPA
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    
    this.logger.info('Routes configured successfully');
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      this.logger.warn('Route not found', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: req.url
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      this.logger.error('Unhandled application error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Don't leak error details in production
      const isDevelopment = config.NODE_ENV === 'development';
      
      res.status(error.status || 500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? error.message : 'An internal error occurred',
        ...(isDevelopment && { stack: error.stack })
      });
    });

    this.logger.info('Error handling configured successfully');
  }

  /**
   * Start the application
   */
  async start() {
    try {
      // Initialize database
      await this.database.initialize();
      this.logger.info('Database initialized successfully');

      // Start server
      const server = this.app.listen(config.PORT, () => {
        this.logger.info('Application started successfully', {
          port: config.PORT,
          environment: config.NODE_ENV,
          version: process.env.npm_package_version || '1.0.0'
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown(server));
      process.on('SIGINT', () => this.gracefulShutdown(server));

    } catch (error) {
      this.logger.error('Failed to start application', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(server) {
    this.logger.info('Graceful shutdown initiated');
    
    server.close(() => {
      this.logger.info('HTTP server closed');
      
      // Close database connections
      this.database.close().then(() => {
        this.logger.info('Database connections closed');
        process.exit(0);
      }).catch((error) => {
        this.logger.error('Error closing database connections', {
          error: error.message
        });
        process.exit(1);
      });
    });

    // Force close after 30 seconds
    setTimeout(() => {
      this.logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  }
}

module.exports = Application;

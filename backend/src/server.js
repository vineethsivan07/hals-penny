/**
 * Production Server Entry Point
 * Main server startup with proper error handling and logging
 */

const Application = require('./app');
const { logger } = require('./config/logger');
const config = require('./config/environment');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
  process.exit(1);
});

// Start the application
async function startServer() {
  try {
    logger.info('Starting HAL\'s Penny server', {
      environment: config.NODE_ENV,
      port: config.PORT,
      version: process.env.npm_package_version || '1.0.0'
    });

    const app = new Application();
    await app.start();

  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Start the server
startServer();

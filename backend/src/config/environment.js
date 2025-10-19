/**
 * Environment Configuration
 * Centralized environment variable management with validation
 */

const Joi = require('joi');

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .port()
    .default(3000),
  
  // Database configuration
  DATABASE_URL: Joi.string()
    .default('./database.sqlite'),
  
  // AI Service API Keys
  ANTHROPIC_API_KEY: Joi.string()
    .pattern(/^sk-ant-/)
    .required(),
  
  OPENAI_API_KEY: Joi.string()
    .pattern(/^sk-/)
    .required(),
  
  // Firebase configuration
  FIREBASE_PROJECT_ID: Joi.string()
    .required(),
  
  FIREBASE_PRIVATE_KEY: Joi.string()
    .required(),
  
  FIREBASE_CLIENT_EMAIL: Joi.string()
    .email()
    .required(),
  
  // Security
  JWT_SECRET: Joi.string()
    .min(32)
    .required(),
  
  CORS_ORIGIN: Joi.string()
    .default('http://localhost:3001'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .default(900000), // 15 minutes
  
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .default(100),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  
  LOG_FILE_PATH: Joi.string()
    .default('./logs/app.log'),
  
  // File upload
  MAX_FILE_SIZE: Joi.number()
    .default(5242880), // 5MB
  
  UPLOAD_DIR: Joi.string()
    .default('./uploads')
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Export validated configuration
module.exports = {
  // Application
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  
  // Database
  DATABASE_URL: envVars.DATABASE_URL,
  
  // AI Services
  AI: {
    ANTHROPIC_API_KEY: envVars.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: envVars.OPENAI_API_KEY,
  },
  
  // Firebase
  FIREBASE: {
    PROJECT_ID: envVars.FIREBASE_PROJECT_ID,
    PRIVATE_KEY: envVars.FIREBASE_PRIVATE_KEY,
    CLIENT_EMAIL: envVars.FIREBASE_CLIENT_EMAIL,
  },
  
  // Security
  SECURITY: {
    JWT_SECRET: envVars.JWT_SECRET,
    CORS_ORIGIN: envVars.CORS_ORIGIN,
  },
  
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: envVars.RATE_LIMIT_WINDOW_MS,
    MAX_REQUESTS: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  
  // Logging
  LOGGING: {
    LEVEL: envVars.LOG_LEVEL,
    FILE_PATH: envVars.LOG_FILE_PATH,
  },
  
  // File upload
  UPLOAD: {
    MAX_FILE_SIZE: envVars.MAX_FILE_SIZE,
    UPLOAD_DIR: envVars.UPLOAD_DIR,
  }
};

#!/usr/bin/env node

/**
 * Migration Script: Legacy to Production Structure
 * Moves existing code to the new production-ready structure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const logger = console;

// Migration mapping
const migrations = [
  {
    from: 'anthropic-service.js',
    to: 'src/services/anthropic-service.js',
    description: 'Move Anthropic service to services directory'
  },
  {
    from: 'openai-service.js', 
    to: 'src/services/openai-service.js',
    description: 'Move OpenAI service to services directory'
  },
  {
    from: 'database.js',
    to: 'src/models/database.js',
    description: 'Move database to models directory'
  },
  {
    from: 'server.js',
    to: 'server-legacy.js',
    description: 'Backup legacy server file'
  }
];

// Frontend migrations
const frontendMigrations = [
  {
    from: 'frontend/src/components/',
    to: 'frontend/src/components/',
    description: 'Frontend components (no change needed)'
  }
];

function createDirectories() {
  const directories = [
    'src/controllers',
    'src/services', 
    'src/middleware',
    'src/models',
    'src/utils',
    'src/config',
    'src/routes',
    'tests',
    'docs',
    'logs',
    'scripts',
    'docker'
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.log(`✅ Created directory: ${dir}`);
    } else {
      logger.log(`📁 Directory exists: ${dir}`);
    }
  });
}

function migrateFiles() {
  logger.log('\n🔄 Migrating files to production structure...\n');

  migrations.forEach(migration => {
    const sourcePath = migration.from;
    const targetPath = migration.to;
    const targetDir = path.dirname(targetPath);

    try {
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Check if source file exists
      if (fs.existsSync(sourcePath)) {
        // Copy file to new location
        fs.copyFileSync(sourcePath, targetPath);
        logger.log(`✅ ${migration.description}`);
        logger.log(`   ${sourcePath} → ${targetPath}`);
      } else {
        logger.log(`⚠️  Source file not found: ${sourcePath}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to migrate ${sourcePath}:`, error.message);
    }
  });
}

function updatePackageJson() {
  logger.log('\n📦 Updating package.json for production...\n');

  try {
    // Read current package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Update main entry point
    packageJson.main = 'src/server.js';
    
    // Update scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'start': 'node src/server.js',
      'dev': 'nodemon src/server.js',
      'test': 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      'lint': 'eslint src/ --ext .js',
      'lint:fix': 'eslint src/ --ext .js --fix',
      'build:frontend': 'cd frontend && npm run build',
      'build': 'npm run build:frontend',
      'docker:build': 'docker build -t hals-penny .',
      'docker:run': 'docker run -p 3000:3000 hals-penny',
      'logs': 'tail -f logs/app.log',
      'logs:error': 'tail -f logs/error.log'
    };

    // Add production dependencies
    const productionDeps = {
      'winston': '^3.11.0',
      'joi': '^17.11.0',
      'helmet': '^7.1.0',
      'compression': '^1.7.4',
      'express-rate-limit': '^7.1.5',
      'xss': '^1.0.14',
      'validator': '^13.11.0'
    };

    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...productionDeps
    };

    // Add dev dependencies
    const devDeps = {
      'jest': '^29.7.0',
      'supertest': '^6.3.3',
      'eslint': '^8.55.0'
    };

    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      ...devDeps
    };

    // Add Jest configuration
    packageJson.jest = {
      testEnvironment: 'node',
      collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js'
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html']
    };

    // Add ESLint configuration
    packageJson.eslintConfig = {
      env: {
        node: true,
        es2022: true,
        jest: true
      },
      extends: ['eslint:recommended'],
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      rules: {
        'no-console': 'warn',
        'no-unused-vars': 'error',
        'prefer-const': 'error',
        'no-var': 'error'
      }
    };

    // Write updated package.json
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    logger.log('✅ Updated package.json for production');
  } catch (error) {
    logger.error('❌ Failed to update package.json:', error.message);
  }
}

function createEnvironmentTemplate() {
  logger.log('\n🔧 Creating environment template...\n');

  const envTemplate = `# Production Environment Configuration
# Copy this file to .env and fill in your actual values

# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=./database.sqlite

# AI Services
ANTHROPIC_API_KEY=your-anthropic-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Security
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
`;

  try {
    fs.writeFileSync('.env.template', envTemplate);
    logger.log('✅ Created .env.template');
  } catch (error) {
    logger.error('❌ Failed to create .env.template:', error.message);
  }
}

function installDependencies() {
  logger.log('\n📦 Installing production dependencies...\n');

  try {
    execSync('npm install', { stdio: 'inherit' });
    logger.log('✅ Dependencies installed successfully');
  } catch (error) {
    logger.error('❌ Failed to install dependencies:', error.message);
  }
}

function createGitignore() {
  logger.log('\n📝 Updating .gitignore for production...\n');

  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production
.env
.env.local
.env.production
.env.test

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Database
*.sqlite
*.sqlite3
*.db

# Uploads
uploads/
temp/

# Docker
.dockerignore

# Production builds
dist/
build/
`;

  try {
    fs.writeFileSync('.gitignore', gitignoreContent);
    logger.log('✅ Updated .gitignore');
  } catch (error) {
    logger.error('❌ Failed to update .gitignore:', error.message);
  }
}

function main() {
  logger.log('🚀 HAL\'s Penny - Production Migration Script');
  logger.log('===============================================\n');

  try {
    // Step 1: Create directory structure
    logger.log('📁 Creating production directory structure...');
    createDirectories();

    // Step 2: Migrate files
    migrateFiles();

    // Step 3: Update package.json
    updatePackageJson();

    // Step 4: Create environment template
    createEnvironmentTemplate();

    // Step 5: Update .gitignore
    createGitignore();

    // Step 6: Install dependencies
    installDependencies();

    logger.log('\n🎉 Migration completed successfully!');
    logger.log('\n📋 Next steps:');
    logger.log('1. Copy .env.template to .env and configure your environment variables');
    logger.log('2. Update your AI service API keys in .env');
    logger.log('3. Configure Firebase settings in .env');
    logger.log('4. Test the application: npm run dev');
    logger.log('5. Build for production: npm run build');
    logger.log('6. Deploy with Docker: npm run docker:build');

  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
main();

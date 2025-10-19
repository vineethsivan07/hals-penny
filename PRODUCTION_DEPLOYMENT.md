# Production Deployment Guide

## 🚀 **Production-Ready Application Structure**

### **New Architecture Overview**

```
hals-penny/
├── src/                    # Production source code
│   ├── controllers/        # Route handlers
│   ├── services/          # Business logic
│   ├── middleware/         # Security & validation
│   ├── models/            # Data models
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration
│   └── routes/            # Route definitions
├── frontend/              # React application
├── tests/                 # Test files
├── docs/                  # Documentation
├── logs/                  # Application logs
├── scripts/               # Build scripts
└── docker/                # Docker configuration
```

## 🔒 **Security Improvements Implemented**

### **1. Input Validation & Sanitization**
- **Joi schema validation** for all API endpoints
- **XSS protection** with input sanitization
- **SQL injection prevention** with pattern detection
- **Request size limiting** to prevent DoS attacks

### **2. Security Headers**
- **Helmet.js** for security headers
- **CORS configuration** with origin validation
- **Content Security Policy** (CSP)
- **HSTS** for HTTPS enforcement

### **3. Rate Limiting**
- **API rate limiting** (100 requests per 15 minutes)
- **Authentication rate limiting** (5 attempts per 15 minutes)
- **Upload rate limiting** (10 uploads per hour)

### **4. Authentication & Authorization**
- **Firebase Authentication** integration
- **JWT token validation**
- **User-specific data isolation**
- **Role-based access control**

## 📊 **Structured Logging System**

### **Log Levels & Categories**
```javascript
// Application logs
logger.info('User action', { userId, action, details });

// Performance logs
performanceLogger('database_query', duration, { query, rows });

// Security logs
securityLogger('rate_limit_exceeded', { ip, endpoint, attempts });

// Business logs
businessLogger('expense_created', 'expense', { amount, category, userId });
```

### **Log Outputs**
- **Console**: Development and debugging
- **File**: Persistent application logs
- **Error logs**: Separate error tracking
- **Exception logs**: Uncaught exceptions
- **Rejection logs**: Unhandled promise rejections

## 🏷️ **Naming Conventions**

### **Files & Directories**
- **kebab-case**: `expense-controller.js`, `ai-service.js`
- **Descriptive names**: `security-middleware.js`, `expense-model.js`

### **Variables & Functions**
- **camelCase**: `getExpenseById`, `createExpense`
- **Descriptive names**: `expenseData`, `userId`, `parsedAmount`

### **Classes & Components**
- **PascalCase**: `ExpenseController`, `AIService`
- **Suffixes**: `Controller`, `Service`, `Model`, `Middleware`

### **Constants**
- **UPPER_SNAKE_CASE**: `MAX_FILE_SIZE`, `RATE_LIMIT_WINDOW_MS`

## 🐳 **Docker Production Setup**

### **Multi-stage Build**
```dockerfile
# Builder stage
FROM node:18-alpine AS builder
# Install dependencies and build

# Production stage
FROM node:18-alpine AS production
# Copy built application and run
```

### **Security Features**
- **Non-root user** execution
- **Minimal Alpine Linux** base image
- **Health checks** for container monitoring
- **Volume mounts** for persistent data

## 📋 **Environment Configuration**

### **Required Environment Variables**
```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=./database.sqlite

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Security
JWT_SECRET=your-super-secret-key-32-chars-minimum
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
```

## 🚀 **Deployment Options**

### **1. Docker Deployment**
```bash
# Build and run with Docker
docker build -t hals-penny .
docker run -p 3000:3000 --env-file .env hals-penny

# Or use Docker Compose
docker-compose up -d
```

### **2. PM2 Process Management**
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name "hals-penny"

# Monitor
pm2 monit
```

### **3. Systemd Service**
```bash
# Create service file
sudo nano /etc/systemd/system/hals-penny.service

# Enable and start
sudo systemctl enable hals-penny
sudo systemctl start hals-penny
```

## 📈 **Monitoring & Observability**

### **Health Checks**
- **Endpoint**: `GET /health`
- **Response**: Application status, uptime, version
- **Docker health check** integration

### **Log Monitoring**
```bash
# View application logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log

# View all logs
tail -f logs/*.log
```

### **Performance Metrics**
- **Request/response timing**
- **Database query performance**
- **AI service response times**
- **Memory and CPU usage**

## 🔧 **Production Scripts**

### **Package.json Scripts**
```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "jest",
  "lint": "eslint src/ --ext .js",
  "build": "npm run build:frontend",
  "docker:build": "docker build -t hals-penny .",
  "logs": "tail -f logs/app.log"
}
```

## 🛡️ **Security Checklist**

### **✅ Implemented Security Measures**
- [x] Input validation and sanitization
- [x] SQL injection prevention
- [x] XSS protection
- [x] Rate limiting
- [x] CORS configuration
- [x] Security headers
- [x] Request size limiting
- [x] Authentication & authorization
- [x] Structured logging
- [x] Error handling
- [x] Environment variable validation

### **🔍 Security Testing**
```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Run linting
npm run lint

# Run tests
npm test
```

## 📚 **API Documentation**

### **Swagger/OpenAPI**
- **Endpoint**: `/api-docs`
- **Interactive documentation**
- **Request/response schemas**
- **Authentication examples**

### **API Endpoints**
- `GET /health` - Health check
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/parse` - Parse from text
- `POST /api/expenses/query` - AI query processing

## 🎯 **Next Steps**

1. **Configure environment variables**
2. **Set up monitoring and alerting**
3. **Configure reverse proxy (Nginx)**
4. **Set up SSL certificates**
5. **Configure backup strategies**
6. **Set up CI/CD pipeline**
7. **Configure log aggregation**
8. **Set up performance monitoring**

This production-ready structure provides enterprise-grade security, monitoring, and scalability for the HAL's Penny application! 🚀

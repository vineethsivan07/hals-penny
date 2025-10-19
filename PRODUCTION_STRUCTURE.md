# Production Application Structure

## 📁 **New Directory Structure**

```
hals-penny/
├── src/
│   ├── controllers/          # Route handlers
│   ├── services/            # Business logic
│   ├── middleware/          # Custom middleware
│   ├── models/              # Data models
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration files
│   └── routes/              # Route definitions
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   ├── hooks/           # Custom React hooks
│   │   ├── contexts/        # React contexts
│   │   └── types/           # TypeScript types
├── tests/                   # Test files
├── docs/                    # Documentation
├── logs/                    # Application logs
├── scripts/                 # Build and deployment scripts
└── docker/                  # Docker configuration
```

## 🔒 **Security Improvements**

- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet.js for security headers
- Environment variable validation
- SQL injection prevention
- XSS protection

## 📊 **Structured Logging**

- Winston logger with multiple transports
- Request/response logging
- Error tracking
- Performance monitoring
- Audit trails

## 🏷️ **Naming Conventions**

- camelCase for variables and functions
- PascalCase for classes and components
- kebab-case for files and directories
- UPPER_SNAKE_CASE for constants
- Descriptive, self-documenting names

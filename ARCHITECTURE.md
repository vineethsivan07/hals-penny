# HAL's Penny - AI Expense Tracker Architecture

## 🏗️ System Overview

HAL's Penny is a modern, AI-powered expense tracking application built with a microservices architecture, featuring real-time communication, comprehensive monitoring, and multi-tier AI fallback systems.

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                HAL's Penny Architecture                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                │
│  │   Frontend      │    │   Backend       │    │   Monitoring    │                │
│  │   (React.js)    │    │   (Node.js)     │    │   Stack         │                │
│  │   Port: 3002    │    │   Port: 3000    │    │                 │                │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘                │
│           │                       │                       │                     │
│           │                       │                       │                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                │
│  │   User          │    │   AI Services   │    │   Prometheus     │                │
│  │   Interface     │◄──►│   Multi-tier    │    │   Port: 9090     │                │
│  │                 │    │   Fallback      │    │                 │                │
│  │ • Chat UI       │    │                 │    │ • Metrics       │                │
│  │ • Voice Input  │    │ 1. Anthropic    │    │ • Scraping      │                │
│  │ • Camera       │    │ 2. OpenAI       │    │ • Storage       │                │
│  │ • Charts       │    │ 3. Regex        │    │                 │                │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘                │
│           │                       │                       │                     │
│           │                       │                       │                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                │
│  │   Real-time     │    │   Database      │    │   Grafana        │                │
│  │   Communication│    │   (SQLite)      │    │   Port: 3001     │                │
│  │   (Socket.io)   │    │                 │    │                 │                │
│  │                 │    │ • Expenses      │    │ • Dashboards     │                │
│  │ • Chat Events   │    │ • Users         │    │ • Analytics      │                │
│  │ • AI Responses  │    │ • Sessions      │    │ • Monitoring     │                │
│  │ • Status Updates│    │ • Metrics       │    │                 │                │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Component Details

### Frontend Layer (Port 3002)
- **Technology**: React.js with modern hooks
- **Components**:
  - `ChatInterface.js` - Main chat UI with AI interaction
  - `MicButton.js` - Voice input functionality
  - `CameraButton.js` - Receipt photo capture
  - `ReceiptUpload.js` - OCR processing
  - `UserProfile.js` - User management
- **Features**:
  - Real-time chat with AI
  - Voice-to-text input
  - Receipt photo processing
  - Interactive charts and analytics
  - Responsive design with light/dark themes

### Backend Layer (Port 3000)
- **Technology**: Node.js with Express.js
- **Architecture**: RESTful API + Socket.io for real-time communication
- **Key Modules**:
  - `server.js` - Main application server
  - `src/services/anthropic-service.js` - Anthropic Claude integration
  - `src/services/openai-service.js` - OpenAI integration
  - `src/models/database.js` - SQLite database operations
  - `config/logger.js` - Winston logging
  - `config/metrics.js` - Prometheus metrics

### AI Services (Multi-tier Fallback)
1. **Primary**: Anthropic Claude API
   - Advanced reasoning capabilities
   - Natural language processing
   - Expense categorization
   
2. **Secondary**: OpenAI API
   - GPT-based processing
   - Fallback when Anthropic fails
   - Similar capabilities to primary
   
3. **Tertiary**: Regex Fallback
   - Pattern-based parsing
   - Offline capability
   - Basic expense extraction

### Database Layer
- **Technology**: SQLite
- **Tables**:
  - `expenses` - Expense records
  - `users` - User information
  - `sessions` - Chat sessions
- **Features**:
  - ACID compliance
  - Lightweight and portable
  - Built-in backup capabilities

### Monitoring Stack
- **Prometheus** (Port 9090):
  - Metrics collection
  - Time-series data storage
  - Alerting capabilities
  
- **Grafana** (Port 3001):
  - Visualization dashboards
  - Golden Signals monitoring
  - AI Analytics dashboard
  
- **Node Exporter** (Port 9100):
  - System metrics
  - Hardware monitoring

## 🔄 Data Flow

### Expense Processing Flow
```
User Input → Frontend → Socket.io → Backend → AI Service → Database → Response → Frontend
```

### AI Fallback Flow
```
User Query → Anthropic API → Success? → Response
                ↓ No
            OpenAI API → Success? → Response
                ↓ No
            Regex Parser → Response
```

### Monitoring Flow
```
Application → Metrics → Prometheus → Grafana → Dashboards
```

## 🛡️ Security & Performance

### Security Features
- CORS configuration for cross-origin requests
- Input validation and sanitization
- API rate limiting
- Environment variable protection
- SQL injection prevention

### Performance Optimizations
- Connection pooling
- Caching strategies
- Async/await patterns
- Real-time communication
- Optimized database queries

## 📈 Scalability Considerations

### Horizontal Scaling
- Stateless backend design
- Database connection pooling
- Load balancer ready
- Container deployment ready

### Monitoring & Observability
- Comprehensive metrics collection
- Real-time dashboards
- Error tracking and logging
- Performance monitoring
- Business metrics tracking

## 🚀 Deployment Architecture

### Development Environment
- Local development servers
- Hot reloading for frontend
- Live monitoring stack
- Real-time debugging

### Production Ready Features
- Docker containerization
- Environment configuration
- Logging and monitoring
- Health checks
- Graceful shutdown handling

## 📊 Key Metrics Tracked

### Business Metrics
- Total expenses created
- Expense amounts by category
- User engagement patterns
- AI service usage

### Technical Metrics
- API response times
- Database operation performance
- AI service response times
- Error rates and fallback usage
- System resource utilization

### User Experience Metrics
- Active users
- Chat message patterns
- Voice input usage
- Feature adoption rates

## 🔧 API Documentation

### REST Endpoints
- `GET /api/expenses` - Retrieve all expenses
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/stats/daily` - Daily analytics
- `GET /api/expenses/insights` - AI insights
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

### Socket.io Events
- `parseExpense` - AI expense parsing
- `query` - Natural language queries
- `saveExpense` - Save confirmed expenses
- `expenseParsed` - AI parsing results
- `expenseSaved` - Confirmation events

## 🎯 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React.js, Socket.io-client | User interface |
| Backend | Node.js, Express.js | API server |
| Database | SQLite | Data persistence |
| AI Services | Anthropic, OpenAI, Regex | Natural language processing |
| Monitoring | Prometheus, Grafana | Observability |
| Communication | Socket.io | Real-time messaging |
| Documentation | Swagger/OpenAPI | API documentation |

This architecture provides a robust, scalable, and maintainable foundation for the HAL's Penny expense tracking application.

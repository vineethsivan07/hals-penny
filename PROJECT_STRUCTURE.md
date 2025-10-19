# HAL's Penny - Project Structure

## 📁 Directory Organization

```
hals-penny/
├── 📁 backend/                    # Node.js Backend API
│   ├── 📁 src/                   # Backend source code
│   │   ├── 📁 controllers/        # Request handlers
│   │   │   └── expense-controller.js
│   │   ├── 📁 middleware/        # Custom middleware
│   │   │   └── security.js
│   │   ├── 📁 models/            # Database models
│   │   │   ├── database.js
│   │   │   ├── expense.js
│   │   │   └── expenses.db
│   │   ├── 📁 routes/            # API routes
│   │   │   └── expense-routes.js
│   │   ├── 📁 services/          # Business logic & AI services
│   │   │   ├── ai-service.js
│   │   │   ├── anthropic-service.js
│   │   │   └── openai-service.js
│   │   └── 📁 utils/             # Utility functions
│   ├── 📁 config/                # Configuration files
│   │   ├── environment.js
│   │   └── logger.js
│   ├── 📁 tests/                 # Backend tests
│   ├── 📁 logs/                  # Log files
│   ├── 📄 server.js              # Main server file
│   ├── 📄 package.json           # Backend dependencies
│   ├── 📄 .env                   # Environment variables
│   ├── 📄 swagger.yaml           # API documentation
│   ├── 📄 Dockerfile             # Docker configuration
│   └── 📄 README.md              # Backend documentation
│
├── 📁 frontend/                  # React.js Frontend
│   ├── 📁 src/                   # Frontend source code
│   │   ├── 📁 components/        # React components
│   │   │   ├── ChatInterface.js/css
│   │   │   ├── ExpenseChart.js/css
│   │   │   ├── ExpenseSummary.js/css
│   │   │   ├── DailyAnalytics.js/css
│   │   │   ├── MicButton.js
│   │   │   ├── CameraButton.js
│   │   │   ├── UserProfile.js/css
│   │   │   ├── ProfilePage.js/css
│   │   │   ├── ReceiptUpload.js/css
│   │   │   ├── VoiceCommand.js/css
│   │   │   ├── AuthForm.js/css
│   │   │   └── AuthGuard.js
│   │   ├── 📁 contexts/          # React contexts
│   │   │   └── AuthContext.js
│   │   ├── 📁 firebase/          # Firebase configuration
│   │   │   └── config.js
│   │   ├── 📁 services/          # Frontend services
│   │   │   ├── api.js
│   │   │   └── VoiceService.js
│   │   ├── 📄 App.js/css         # Main app component
│   │   └── 📄 index.js/css       # Entry point
│   ├── 📁 public/                # Static assets
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── 📄 package.json           # Frontend dependencies
│   └── 📄 README.md              # Frontend documentation
│
├── 📁 docs/                      # Documentation
│   ├── PRODUCTION_DEPLOYMENT.md
│   ├── PRODUCTION_STRUCTURE.md
│   └── CLEANUP_SUMMARY.md
│
├── 📁 scripts/                   # Utility scripts
│   └── migrate-to-production.js
│
├── 📄 package.json               # Root project configuration
├── 📄 README.md                  # Main project documentation
├── 📄 PROJECT_STRUCTURE.md       # This file
├── 📄 docker-compose.yml         # Docker compose configuration
└── 📄 .gitignore                 # Git ignore rules
```

## 🎯 Functional Separation

### Backend (API Server)
- **Purpose**: Handles all server-side logic, AI processing, and data management
- **Technology**: Node.js, Express.js, Socket.io
- **Key Features**:
  - AI service integration (Anthropic, OpenAI)
  - Database operations (SQLite)
  - Real-time communication (Socket.io)
  - API endpoints for CRUD operations
  - Security middleware and validation

### Frontend (Web Application)
- **Purpose**: User interface and client-side functionality
- **Technology**: React.js, Chart.js, Web APIs
- **Key Features**:
  - Chat interface with AI advisor
  - Expense tracking and visualization
  - Voice and camera input
  - Real-time updates
  - Responsive design

## 🔄 Data Flow

```
User Input → Frontend → Socket.io → Backend → AI Services → Database
                ↓
User Interface ← Frontend ← Socket.io ← Backend ← AI Response
```

## 🚀 Development Workflow

### Backend Development
```bash
cd backend/
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend/
npm install
npm start
```

### Full Stack Development
```bash
# From root directory
npm run dev:all
```

## 📦 Dependencies

### Backend Dependencies
- **Core**: Express.js, Socket.io, SQLite3
- **AI**: Anthropic SDK, OpenAI SDK
- **Security**: Helmet, CORS, Rate limiting
- **Utilities**: Winston, Joi, Multer

### Frontend Dependencies
- **Core**: React.js, React Router
- **UI**: Chart.js, Lucide React
- **Communication**: Socket.io Client
- **APIs**: Web Speech API, Firebase

## 🧪 Testing Structure

### Backend Tests
- Unit tests for services
- Integration tests for API endpoints
- Database operation tests
- AI service tests

### Frontend Tests
- Component tests
- Integration tests
- User interaction tests
- API communication tests

## 🐳 Docker Configuration

- **Backend**: Node.js server with all dependencies
- **Frontend**: React build served by backend
- **Database**: SQLite file persistence
- **Networking**: Internal communication between services

## 📝 Documentation

- **Root**: Main project overview and setup
- **Backend**: API documentation and server setup
- **Frontend**: Component documentation and UI setup
- **Production**: Deployment and production configuration

This structure ensures clear separation of concerns while maintaining functionality and enabling independent development of backend and frontend components.

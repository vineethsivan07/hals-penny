# HAL's Penny 💼

**Professional AI Financial Advisor & Expense Tracker**

A sophisticated expense tracking application powered by AI that acts as your personal financial advisor, helping you manage expenses, analyze spending patterns, and make informed financial decisions.

## 🏗️ Project Structure

```
hals-penny/
├── backend/                 # Node.js API Server
│   ├── src/                # Backend source code
│   ├── config/             # Configuration files
│   ├── tests/              # Backend tests
│   └── package.json        # Backend dependencies
├── frontend/               # React.js Web Application
│   ├── src/                # Frontend source code
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── package.json            # Root project configuration
```

## 🚀 Quick Start

```bash
# Install all dependencies
npm run install:all

# Start both backend and frontend
npm run dev:all

# Or start individually
npm run dev          # Backend only
npm run frontend     # Frontend only
```

## 🎯 Features

### 💼 Professional Financial Advisor
- **AI-Powered Analysis**: Multi-tier AI system (Anthropic → OpenAI → Fallback)
- **Strategic Guidance**: Professional financial advice and recommendations
- **Spending Insights**: Detailed analysis of spending patterns
- **Budget Optimization**: Recommendations for financial improvement

### 📱 Modern Interface
- **Chat Interface**: Natural conversation with AI advisor
- **Voice Input**: Speech-to-text for hands-free expense entry
- **Camera Capture**: Photo capture for receipt scanning
- **Real-time Updates**: Live chat and expense tracking

### 📊 Analytics & Insights
- **Expense Charts**: Visual spending analysis
- **Daily Analytics**: Budget tracking and comparisons
- **Category Breakdown**: Detailed spending by category
- **Financial Summaries**: Comprehensive expense reports

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **Socket.io** for real-time communication
- **SQLite** database
- **AI Services**: Anthropic Claude, OpenAI GPT
- **Security**: Helmet, CORS, Rate limiting

### Frontend
- **React.js** with modern hooks
- **Chart.js** for data visualization
- **Lucide React** for icons
- **Socket.io Client** for real-time updates
- **Web Speech API** for voice input

## 🔧 Development

```bash
# Backend development
cd backend
npm run dev

# Frontend development  
cd frontend
npm start

# Run tests
npm run test:all

# Lint code
npm run lint:all
```

## 📡 API Endpoints

- `GET /health` - Health check
- `GET /api/expenses` - Get expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/stats` - Statistics
- `GET /api/expenses/stats/daily` - Daily analytics
- `DELETE /api/expenses/clear` - Clear expenses

## 🤖 AI Integration

**Multi-tier AI System:**
1. **Primary**: Anthropic Claude API (Professional financial advisor)
2. **Secondary**: OpenAI API (Backup AI service)
3. **Fallback**: Regex parsing (Offline mode)

## 🐳 Docker Support

```bash
# Build and run with Docker
npm run docker:build
npm run docker:run
```

## 📝 Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

```env
# Backend .env
PORT=3000
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key

# Frontend .env
REACT_APP_API_URL=http://localhost:3000
```

## 🧪 Testing

```bash
# Run all tests
npm run test:all

# Backend tests only
npm run test

# Frontend tests only
npm run test:frontend
```

## 📚 Documentation

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md)
- [API Documentation](./swagger.yaml)

## 🎨 UI Features

- **Light Theme**: Clean, professional design
- **Responsive Layout**: Works on all devices
- **Real-time Chat**: Instant AI responses
- **Voice Commands**: Hands-free interaction
- **Photo Capture**: Receipt scanning
- **Financial Insights**: AI-powered analysis

## 🚀 Production Ready

- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston for comprehensive logging
- **Error Handling**: Robust error management
- **Performance**: Optimized for production
- **Monitoring**: Health checks and metrics

---

**HAL's Penny** - Your Professional AI Financial Advisor 💼✨
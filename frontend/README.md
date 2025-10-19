# HAL's Penny Frontend

Modern React-based expense tracking interface with AI financial advisor.

## 🏗️ Architecture

```
frontend/
├── src/                    # Source code
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── firebase/          # Firebase configuration
│   └── services/          # Frontend services
├── public/                # Static assets
├── package.json           # Frontend dependencies
└── README.md              # This file
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🎨 Features

- **Chat Interface**: AI-powered financial advisor chat
- **Expense Tracking**: Add, view, and manage expenses
- **Analytics**: Charts and spending insights
- **Voice Input**: Speech-to-text for expense entry
- **Camera Input**: Photo capture for receipts
- **Real-time Updates**: Socket.io integration

## 🧩 Components

- `ChatInterface` - Main chat component
- `ExpenseChart` - Data visualization
- `ExpenseSummary` - Spending overview
- `DailyAnalytics` - Daily budget tracking
- `MicButton` - Voice input
- `CameraButton` - Photo capture
- `UserProfile` - User management

## 🎯 Key Features

- **Professional UI**: Clean, modern design
- **Responsive Layout**: Works on all devices
- **Real-time Chat**: Instant AI responses
- **Voice Commands**: Hands-free expense entry
- **Photo Capture**: Receipt scanning
- **Financial Insights**: AI-powered analysis

## 🧪 Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
```

## 📦 Build

```bash
npm run build         # Production build
npm run build:analyze # Bundle analysis
```
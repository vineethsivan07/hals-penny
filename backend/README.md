# HAL's Penny Backend

Professional AI-powered expense tracking API with financial advisor capabilities.

## 🏗️ Architecture

```
backend/
├── src/                    # Source code
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic & AI services
│   └── utils/             # Utility functions
├── config/                 # Configuration files
├── tests/                  # Test files
├── logs/                  # Log files
├── server.js              # Main server file
├── package.json           # Backend dependencies
└── README.md              # This file
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
NODE_ENV=development
```

## 📡 API Endpoints

- `GET /health` - Health check
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/stats` - Get expense statistics
- `GET /api/expenses/stats/daily` - Get daily analytics
- `DELETE /api/expenses/clear` - Clear all expenses

## 🤖 AI Services

- **Primary**: Anthropic Claude API
- **Secondary**: OpenAI API  
- **Fallback**: Regex parsing

## 🧪 Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 📝 Logging

```bash
npm run logs        # View application logs
npm run logs:error  # View error logs
```

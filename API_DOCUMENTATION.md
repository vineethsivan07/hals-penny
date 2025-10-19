# HAL's Penny API Documentation

## Overview

HAL's Penny is an AI-powered expense tracking application with natural language processing capabilities. The API provides endpoints for managing expenses, analytics, and real-time communication via WebSocket.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://api.halspenny.com`

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:3000/api-docs`

## Features

### 🤖 Multi-tier AI System
- **Primary**: Anthropic Claude API for natural language processing
- **Secondary**: OpenAI API as backup
- **Fallback**: Regex parsing for offline mode

### 💬 Real-time Communication
- WebSocket support for live updates
- Real-time expense notifications
- Chat interface integration

### 📊 Analytics & Reporting
- Daily budget analytics with configurable limits
- Category-based expense tracking
- Monthly and yearly summaries
- Interactive charts and visualizations

### 🎨 Modern UI
- Glassmorphism design
- Mobile-responsive interface
- Real-time status indicators

## Authentication

Currently, no authentication is required. All endpoints are publicly accessible.

## Rate Limits

- AI API calls are subject to provider rate limits
- Offline mode bypasses AI services for unlimited usage

## API Endpoints

### Expenses

#### Get All Expenses
```http
GET /api/expenses
```

**Response:**
```json
[
  {
    "id": 1,
    "description": "Coffee",
    "amount": 4.50,
    "category": "food",
    "date": "2025-10-19",
    "created_at": "2025-10-19 10:30:00"
  }
]
```

#### Get Expense by ID
```http
GET /api/expenses/{id}
```

#### Create New Expense
```http
POST /api/expenses
Content-Type: application/json

{
  "description": "Coffee",
  "amount": 4.50,
  "category": "food",
  "date": "2025-10-19"
}
```

#### Update Expense
```http
PUT /api/expenses/{id}
Content-Type: application/json

{
  "description": "Updated Coffee",
  "amount": 5.00,
  "category": "food",
  "date": "2025-10-19"
}
```

#### Delete Expense
```http
DELETE /api/expenses/{id}
```

#### Clear All Expenses
```http
DELETE /api/expenses/clear
```

### Analytics

#### Daily Analytics
```http
GET /api/expenses/stats/daily
```

**Response:**
```json
[
  {
    "date": "2025-10-19",
    "transaction_count": 3,
    "total_amount": 100.50,
    "descriptions": "Coffee | Lunch | Gas",
    "categories": "food | food | transport"
  }
]
```

#### Summary Statistics
```http
GET /api/expenses/stats/summary
```

#### Expenses by Category
```http
GET /api/expenses/stats/by-category
```

#### Monthly Expenses
```http
GET /api/expenses/stats/monthly
```

## Data Models

### Expense
```json
{
  "id": 1,
  "description": "Coffee",
  "amount": 4.50,
  "category": "food",
  "date": "2025-10-19",
  "created_at": "2025-10-19 10:30:00"
}
```

### Expense Input
```json
{
  "description": "Coffee",
  "amount": 4.50,
  "category": "food",
  "date": "2025-10-19"
}
```

### Daily Statistics
```json
{
  "date": "2025-10-19",
  "transaction_count": 3,
  "total_amount": 100.50,
  "descriptions": "Coffee | Lunch | Gas",
  "categories": "food | food | transport"
}
```

## Categories

Supported expense categories:
- `food` - Food and dining
- `transport` - Transportation and travel
- `shopping` - Shopping and retail
- `entertainment` - Entertainment and leisure
- `bills` - Bills and utilities
- `healthcare` - Healthcare and medical
- `education` - Education and learning
- `other` - Other expenses

## WebSocket Events

### Client to Server

#### Parse Expense
```json
{
  "type": "parseExpense",
  "data": {
    "message": "I spent $30 on lunch",
    "conversationHistory": [],
    "optimizeMode": false,
    "offlineMode": false
  }
}
```

#### Save Expense
```json
{
  "type": "saveExpense",
  "data": {
    "description": "lunch",
    "amount": 30,
    "category": "food",
    "date": "2025-10-19"
  }
}
```

### Server to Client

#### Expense Parsed
```json
{
  "type": "expenseParsed",
  "data": {
    "description": "lunch",
    "amount": 30,
    "category": "food",
    "date": "2025-10-19"
  }
}
```

#### Expense Added
```json
{
  "type": "expenseAdded",
  "data": {
    "id": 1,
    "description": "lunch",
    "amount": 30,
    "category": "food",
    "date": "2025-10-19",
    "created_at": "2025-10-19 10:30:00"
  }
}
```

#### Query Response
```json
{
  "type": "queryResponse",
  "data": {
    "response": "You spent $45 on food this month",
    "data": {
      "expenses": [...],
      "summary": {...},
      "byCategory": [...],
      "byMonth": [...]
    }
  }
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message description"
}
```

## Examples

### Creating an Expense
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Coffee",
    "amount": 4.50,
    "category": "food",
    "date": "2025-10-19"
  }'
```

### Getting Daily Analytics
```bash
curl http://localhost:3000/api/expenses/stats/daily
```

### WebSocket Connection (JavaScript)
```javascript
const socket = io('http://localhost:3000');

// Listen for expense updates
socket.on('expenseAdded', (expense) => {
  console.log('New expense:', expense);
});

// Parse natural language expense
socket.emit('parseExpense', {
  message: 'I spent $30 on lunch',
  conversationHistory: [],
  optimizeMode: false,
  offlineMode: false
});
```

## Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
npm install
```

### Running the Server
```bash
npm start
```

### API Documentation
Visit `http://localhost:3000/api-docs` for interactive API documentation.

## Support

For support and questions:
- Email: support@halspenny.com
- GitHub: https://github.com/halspenny/expense-tracker

## License

MIT License - see LICENSE file for details.

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
require('dotenv').config();

const Database = require('./database');
const AnthropicService = require('./anthropic-service');
const OpenAIService = require('./openai-service');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Initialize services
const db = new Database();
const anthropic = new AnthropicService();
const openai = new OpenAIService();

// Load OpenAPI specification
const swaggerDocument = YAML.load('./swagger.yaml');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "HAL's Penny API Documentation",
  customfavIcon: '/favicon.ico'
}));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes for Expense Tracking

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get all expenses
 *     description: Retrieve all expenses from the database
 *     tags: [expenses]
 *     responses:
 *       200:
 *         description: List of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Expense'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await db.getExpenses();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Get expense by ID
 *     description: Retrieve a specific expense by its ID
 *     tags: [expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Expense ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Expense found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       404:
 *         description: Expense not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await db.getExpenseById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create a new expense
 *     description: Add a new expense to the database
 *     tags: [expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpenseInput'
 *           examples:
 *             coffee:
 *               summary: Coffee expense
 *               value:
 *                 description: "Coffee"
 *                 amount: 4.50
 *                 category: "food"
 *                 date: "2025-10-19"
 *             gas:
 *               summary: Gas expense
 *               value:
 *                 description: "Gas"
 *                 amount: 45.00
 *                 category: "transport"
 *                 date: "2025-10-19"
 *     responses:
 *       201:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Create new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;
    
    if (!description || !amount || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newExpense = await db.addExpense({
      description,
      amount: parseFloat(amount),
      category,
      date: date || new Date().toISOString().split('T')[0]
    });
    
    // Emit to all connected clients
    io.emit('expenseAdded', newExpense);
    
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Parse expense from natural language
app.post('/api/expenses/parse', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const parsedExpense = await openai.parseExpense(message);
    
    // Set today's date if not specified
    if (!parsedExpense.date) {
      parsedExpense.date = new Date().toISOString().split('T')[0];
    }

    res.json(parsedExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to parse expense' });
  }
});

// Process natural language query
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Get relevant expense data based on query
    let expenseData = {};
    
    if (query.toLowerCase().includes('last month') || query.toLowerCase().includes('this month')) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
      
      expenseData.expenses = await db.getExpensesInDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
    } else if (query.toLowerCase().includes('food') || query.toLowerCase().includes('dining')) {
      expenseData.expenses = await db.getExpensesByCategory();
      expenseData.foodExpenses = expenseData.expenses.filter(e => e.category === 'food');
    } else {
      expenseData.expenses = await db.getExpenses();
    }

    expenseData.summary = await db.getTotalExpenses();
    expenseData.byCategory = await db.getExpensesByCategory();
    expenseData.byMonth = await db.getExpensesByMonth();

    const response = await openai.processQuery(query, expenseData);
    
    res.json({ 
      response,
      data: expenseData
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;
    
    const updatedExpense = await db.updateExpense(req.params.id, {
      description: description || undefined,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      category: category || undefined,
      date: date || undefined
    });

    // Emit to all connected clients
    io.emit('expenseUpdated', updatedExpense);
    
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Clear all expenses from database
app.delete('/api/expenses/clear', async (req, res) => {
  try {
    await db.clearAllExpenses();
    // Emit to all connected clients
    io.emit('expensesCleared');
    res.json({ message: 'All expenses cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear expenses' });
  }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const result = await db.deleteExpense(req.params.id);
    
    if (!result.deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Emit to all connected clients
    io.emit('expenseDeleted', { id: req.params.id });
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Get expense statistics
app.get('/api/expenses/stats/summary', async (req, res) => {
  try {
    const total = await db.getTotalExpenses();
    const byCategory = await db.getExpensesByCategory();
    const byMonth = await db.getExpensesByMonth();

    res.json({
      totalExpenses: total.total || 0,
      totalTransactions: total.count || 0,
      byCategory,
      byMonth
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get expenses by category
app.get('/api/expenses/stats/by-category', async (req, res) => {
  try {
    const categoryData = await db.getExpensesByCategory();
    res.json(categoryData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category data' });
  }
});

// Get monthly expenses for the last 6 months
app.get('/api/expenses/stats/monthly', async (req, res) => {
  try {
    const monthlyData = await db.getExpensesByMonth();
    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
});

/**
 * @swagger
 * /api/expenses/stats/daily:
 *   get:
 *     summary: Get daily analytics
 *     description: Retrieve daywise expense analytics for budget tracking
 *     tags: [analytics]
 *     responses:
 *       200:
 *         description: Daily analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DailyStats'
 *             examples:
 *               success:
 *                 summary: Daily analytics
 *                 value:
 *                   - date: "2025-10-19"
 *                     transaction_count: 3
 *                     total_amount: 100.50
 *                     descriptions: "Coffee | Lunch | Gas"
 *                     categories: "food | food | transport"
 *                   - date: "2025-10-18"
 *                     transaction_count: 2
 *                     total_amount: 75.25
 *                     descriptions: "Dinner | Movie"
 *                     categories: "food | entertainment"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get daywise analytics
app.get('/api/expenses/stats/daily', async (req, res) => {
  try {
    const dailyStats = await db.getExpensesByDay();
    res.json(dailyStats);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ error: 'Failed to fetch daily statistics' });
  }
});

// Socket.io connection handling for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send current expenses to newly connected client
  db.getExpenses().then(expenses => {
    socket.emit('expensesLoaded', expenses);
  }).catch(err => {
    console.error('Error loading expenses:', err);
  });
  
  // Handle natural language expense input
  socket.on('parseExpense', async (data) => {
    console.log('Processing expense:', data.message);
    console.log('Offline mode:', data.offlineMode);
    
    let messageType = 'expense'; // Default to expense
    
    // Check if offline mode is enabled
    if (data.offlineMode) {
      console.log('📴 Offline mode: Using fallback classification');
      messageType = anthropic.fallbackClassifyMessage(data.message);
      console.log('🤖 Fallback classified as:', messageType);
    } else {
      // Use AI to classify whether this is a query or expense entry
      
      // Tier 1: Try Anthropic for classification
      try {
        messageType = await anthropic.classifyMessage(data.message, data.conversationHistory, data.optimizeMode);
        console.log('🤖 Anthropic classified as:', messageType);
      } catch (anthropicError) {
        console.log('❌ Anthropic classification failed:', anthropicError.message);
        
        // Tier 2: Try OpenAI for classification
        try {
          messageType = await openai.classifyMessage(data.message, data.conversationHistory, data.optimizeMode);
          console.log('🤖 OpenAI classified as:', messageType);
        } catch (openaiError) {
          console.log('❌ OpenAI classification failed:', openaiError.message);
          
          // Tier 3: Use fallback keyword classification
          messageType = anthropic.fallbackClassifyMessage(data.message);
          console.log('🤖 Fallback classified as:', messageType);
        }
      }
    }
    
    if (messageType === 'query') {
      console.log('🔍 Detected query, processing directly');
      // Process query directly instead of emitting
      const query = data.message;
      
      // Special handling for clear all expenses
      if (query.toLowerCase().includes('clear all') || 
          query.toLowerCase().includes('delete all') || 
          query.toLowerCase().includes('remove all')) {
        try {
          await db.clearAllExpenses();
          console.log('✅ All expenses cleared');
          socket.emit('queryResponse', { 
            response: 'All expenses have been cleared successfully!',
            data: { expenses: [], summary: { total: 0 }, byCategory: [], byMonth: [] }
          });
          // Emit to all connected clients
          io.emit('expensesCleared');
          return;
        } catch (error) {
          console.error('❌ Failed to clear expenses:', error);
          socket.emit('queryError', { error: 'Failed to clear expenses. Please try again.' });
          return;
        }
      }
      
      // Regular query processing
      let expenseData = {};
      expenseData.expenses = await db.getExpenses();
      expenseData.summary = await db.getTotalExpenses();
      expenseData.byCategory = await db.getExpensesByCategory();
      expenseData.byMonth = await db.getExpensesByMonth();

              // Check if offline mode is enabled
              if (data.offlineMode) {
                console.log('📴 Offline mode: Using fallback query processing');
                const fallbackResponse = anthropic.fallbackProcessQuery(query, expenseData);
                console.log('✅ Regex fallback query processed');
                socket.emit('queryResponse', { 
                  response: fallbackResponse,
                  data: expenseData
                });
                return;
              }
              
              // Tier 1: Try Anthropic Claude API
              try {
                const response = await anthropic.processQuery(query, expenseData, data.conversationHistory, data.optimizeMode);
                console.log('✅ Anthropic query processed');
                socket.emit('queryResponse', { 
                  response,
                  data: expenseData
                });
                return;
              } catch (anthropicError) {
                console.log('❌ Anthropic query failed:', anthropicError.message);
              }
              
              // Tier 2: Try OpenAI API
              try {
                const response = await openai.processQuery(query, expenseData, data.conversationHistory, data.optimizeMode);
                console.log('✅ OpenAI query processed');
                socket.emit('queryResponse', { 
                  response,
                  data: expenseData
                });
                return;
              } catch (openaiError) {
                console.log('❌ OpenAI query failed:', openaiError.message);
              }
      
      // Tier 3: Fallback query processing
      try {
        const fallbackResponse = anthropic.fallbackProcessQuery(query, expenseData);
        console.log('✅ Regex fallback query processed');
        socket.emit('queryResponse', { 
          response: fallbackResponse,
          data: expenseData
        });
      } catch (fallbackError) {
        console.error('❌ All query processing methods failed:', fallbackError);
        socket.emit('queryError', { error: 'Failed to process query. Please try a simpler question.' });
      }
      return;
    }
    
            // Check if offline mode is enabled
            if (data.offlineMode) {
              console.log('📴 Offline mode: Using fallback expense parsing');
              const fallbackExpense = anthropic.fallbackParseExpense(data.message);
              console.log('✅ Regex fallback parsed:', fallbackExpense);
              socket.emit('expenseParsed', fallbackExpense);
              return;
            }
            
            // Tier 1: Try Anthropic Claude API
            try {
              const parsedExpense = await anthropic.parseExpense(data.message, data.optimizeMode);
              console.log('✅ Anthropic parsed:', parsedExpense);
              socket.emit('expenseParsed', parsedExpense);
              return;
            } catch (anthropicError) {
              console.log('❌ Anthropic failed:', anthropicError.message);
            }
            
            // Tier 2: Try OpenAI API
            try {
              const parsedExpense = await openai.parseExpense(data.message, data.optimizeMode);
              console.log('✅ OpenAI parsed:', parsedExpense);
              socket.emit('expenseParsed', parsedExpense);
              return;
            } catch (openaiError) {
              console.log('❌ OpenAI failed:', openaiError.message);
            }
    
    // Tier 3: Fallback regex parsing
    try {
      const fallbackExpense = anthropic.fallbackParseExpense(data.message);
      console.log('✅ Regex fallback parsed:', fallbackExpense);
      socket.emit('expenseParsed', fallbackExpense);
    } catch (fallbackError) {
      console.error('❌ All parsing methods failed:', fallbackError);
      socket.emit('parseError', { error: 'Failed to parse expense. Please try a simpler format like "I spent $30 on lunch".' });
    }
  });

  // Handle saving confirmed expenses
  socket.on('saveExpense', async (data) => {
    try {
      console.log('Saving expense:', data);
      const newExpense = await db.addExpense(data);
      console.log('Expense saved:', newExpense);
      socket.emit('expenseAdded', newExpense);
      // Broadcast to other connected clients (excluding the sender)
      socket.broadcast.emit('expenseAdded', newExpense);
    } catch (error) {
      console.error('Error saving expense:', error);
      socket.emit('saveError', { error: 'Failed to save expense' });
    }
  });

  // Handle natural language queries
  socket.on('processQuery', async (data) => {
    console.log('Processing query:', data.query);
    
    const query = data.query;
    
    // Special handling for clear all expenses
    if (query.toLowerCase().includes('clear all') || 
        query.toLowerCase().includes('delete all') || 
        query.toLowerCase().includes('remove all')) {
      try {
        await db.clearAllExpenses();
        console.log('✅ All expenses cleared');
        socket.emit('queryResponse', { 
          response: 'All expenses have been cleared successfully!',
          data: { expenses: [], summary: { total: 0 }, byCategory: [], byMonth: [] }
        });
        // Emit to all connected clients
        io.emit('expensesCleared');
        return;
      } catch (error) {
        console.error('❌ Failed to clear expenses:', error);
        socket.emit('queryError', { error: 'Failed to clear expenses. Please try again.' });
        return;
      }
    }
    
    let expenseData = {};

    // Get relevant data based on query
    if (query.toLowerCase().includes('food') || query.toLowerCase().includes('dining')) {
      expenseData.expenses = await db.getExpenses();
      expenseData.foodExpenses = expenseData.expenses.filter(e => e.category === 'food');
    } else {
      expenseData.expenses = await db.getExpenses();
    }

    expenseData.summary = await db.getTotalExpenses();
    expenseData.byCategory = await db.getExpensesByCategory();
    expenseData.byMonth = await db.getExpensesByMonth();

    // Tier 1: Try Anthropic Claude API
    try {
      const response = await anthropic.processQuery(query, expenseData);
      console.log('✅ Anthropic query processed');
      socket.emit('queryResponse', { 
        response,
        data: expenseData
      });
      return;
    } catch (anthropicError) {
      console.log('❌ Anthropic query failed:', anthropicError.message);
    }
    
    // Tier 2: Try OpenAI API
    try {
      const response = await openai.processQuery(query, expenseData);
      console.log('✅ OpenAI query processed');
      socket.emit('queryResponse', { 
        response,
        data: expenseData
      });
      return;
    } catch (openaiError) {
      console.log('❌ OpenAI query failed:', openaiError.message);
    }
    
    // Tier 3: Fallback query processing
    try {
      const fallbackResponse = anthropic.fallbackProcessQuery(query, expenseData);
      console.log('✅ Regex fallback query processed');
      socket.emit('queryResponse', { 
        response: fallbackResponse,
        data: expenseData
      });
    } catch (fallbackError) {
      console.error('❌ All query processing methods failed:', fallbackError);
      socket.emit('queryError', { error: 'Failed to process query. Please try a simpler question.' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});

// Start server
server.listen(PORT, () => {
        console.log(`🚀 HAL's Penny server running on http://localhost:${PORT}`);
  console.log(`📱 API endpoints available at http://localhost:${PORT}/api/expenses`);
  console.log(`🤖 Multi-tier AI system enabled:`);
  console.log(`   🥇 Primary: Anthropic Claude API`);
  console.log(`   🥈 Secondary: OpenAI API`);
  console.log(`   🥉 Fallback: Regex parsing`);
  console.log(`💾 SQLite database initialized`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use. Trying to kill existing process...`);
    const { exec } = require('child_process');
    exec(`lsof -ti:${PORT} | xargs kill -9`, (error) => {
      if (!error) {
        console.log(`✅ Killed existing process on port ${PORT}`);
        setTimeout(() => {
          server.listen(PORT, () => {
            console.log(`🚀 HAL's Penny server running on http://localhost:${PORT}`);
            console.log(`📱 API endpoints available at http://localhost:${PORT}/api/expenses`);
            console.log(`🤖 Multi-tier AI system enabled:`);
            console.log(`   🥇 Primary: Anthropic Claude API`);
            console.log(`   🥈 Secondary: OpenAI API`);
            console.log(`   🥉 Fallback: Regex parsing`);
            console.log(`💾 SQLite database initialized`);
          });
        }, 1000);
      } else {
        console.error(`❌ Failed to kill process on port ${PORT}:`, error);
        process.exit(1);
      }
    });
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});
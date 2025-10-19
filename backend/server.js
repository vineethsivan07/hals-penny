/**
 * HAL's Penny - AI Expense Tracker Server
 * Simple server for development and testing
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import AI services
const AnthropicService = require('./src/services/anthropic-service');
const OpenAIService = require('./src/services/openai-service');
const Database = require('./src/models/database');

// Import logger
const { logger } = require('./config/logger');

// Import Prometheus metrics
const {
  register,
  totalExpenses,
  totalExpenseAmount,
  averageExpenseAmount,
  expensesByCategory,
  aiServiceCalls,
  aiServiceResponseTime,
  aiServiceErrors,
  aiFallbackUsage,
  userConnections,
  userDisconnections,
  activeUsers,
  chatMessages,
  apiRequests,
  apiResponseTime,
  databaseOperations,
  databaseResponseTime,
  memoryUsage,
  cpuUsage,
  dailySpending,
  monthlySpending,
  budgetUtilization
} = require('./config/metrics');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Log server startup
logger.info('🚀 HAL\'s Penny server starting...', {
  port: PORT,
  environment: process.env.NODE_ENV || 'development'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HAL\'s Penny - AI Expense Tracker API',
      version: '1.0.0',
      description: 'AI-powered expense tracking application with multi-tier AI fallback system',
      contact: {
        name: 'HAL\'s Penny Team',
        email: 'support@halspenny.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Expense: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the expense'
            },
            description: {
              type: 'string',
              description: 'Description of the expense'
            },
            amount: {
              type: 'number',
              description: 'Amount of the expense'
            },
            category: {
              type: 'string',
              description: 'Category of the expense'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Date of the expense'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        }
      }
    }
  },
  apis: ['./server.js'] // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Import and use user routes
const userRoutes = require('./routes/user-routes');
app.use('/api/user', userRoutes);

// Initialize services
const db = new Database();
const anthropicService = new AnthropicService();
const openaiService = new OpenAIService();

// Function to get user subscription preference
async function getUserSubscription(userId) {
  return new Promise((resolve, reject) => {
    const userDb = new sqlite3.Database(dbPath);
    userDb.get('SELECT subscription_plan FROM users WHERE user_id = ?', [userId], (err, row) => {
      if (err) {
        console.error('Error fetching user subscription:', err);
        resolve('free'); // Default to free if error
      } else if (row) {
        resolve(row.subscription_plan);
      } else {
        resolve('free'); // Default to free if user not found
      }
      userDb.close();
    });
  });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'HAL\'s Penny - AI Expense Tracker API',
    version: '1.0.0',
    status: 'running',
    documentation: {
      swagger: '/api-docs',
      description: 'Interactive API documentation with Swagger UI'
    },
    endpoints: {
      health: '/health',
      expenses: '/api/expenses',
      metrics: '/metrics',
      socket: '/socket.io/'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      anthropic: anthropicService.isAvailable ? 'available' : 'unavailable',
      openai: openaiService.isAvailable ? 'available' : 'unavailable'
    }
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    // Update system metrics
    const memUsage = process.memoryUsage();
    memoryUsage.set({ type: 'rss' }, memUsage.rss);
    memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    memoryUsage.set({ type: 'external' }, memUsage.external);
    
    // Get CPU usage (simplified)
    const cpuUsageValue = process.cpuUsage();
    cpuUsage.set(cpuUsageValue.user / 1000000); // Convert to seconds
    
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
});

// API routes
/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get all expenses
 *     description: Retrieve all expenses from the database
 *     tags: [Expenses]
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
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/expenses', async (req, res) => {
  const startTime = Date.now();
  try {
    const dbStartTime = Date.now();
    const expenses = await db.getExpenses();
    const dbResponseTime = (Date.now() - dbStartTime) / 1000;
    
    databaseOperations.inc({ operation: 'get_expenses', table: 'expenses', status: 'success' });
    databaseResponseTime.observe({ operation: 'get_expenses', table: 'expenses' }, dbResponseTime);
    apiRequests.inc({ method: 'GET', endpoint: '/api/expenses', status_code: '200' });
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    databaseOperations.inc({ operation: 'get_expenses', table: 'expenses', status: 'error' });
    apiRequests.inc({ method: 'GET', endpoint: '/api/expenses', status_code: '500' });
    res.status(500).json({ error: error.message });
  } finally {
    const totalResponseTime = (Date.now() - startTime) / 1000;
    apiResponseTime.observe({ method: 'GET', endpoint: '/api/expenses' }, totalResponseTime);
  }
});

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create a new expense
 *     description: Add a new expense to the database
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - amount
 *               - category
 *               - date
 *             properties:
 *               description:
 *                 type: string
 *                 description: Description of the expense
 *               amount:
 *                 type: number
 *                 description: Amount of the expense
 *               category:
 *                 type: string
 *                 description: Category of the expense
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of the expense
 *     responses:
 *       200:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/expenses', async (req, res) => {
  try {
    const expense = await db.addExpense(req.body);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/expenses/clear', async (req, res) => {
  try {
    await db.clearExpenses();
    // Emit to all connected clients that expenses were cleared
    io.emit('expensesCleared');
    res.json({ message: 'All expenses cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Daily analytics endpoint
app.get('/api/expenses/stats/daily', async (req, res) => {
  try {
    const expenses = await db.getExpenses();
    
    // Group expenses by date
    const dailyStats = {};
    
    expenses.forEach(expense => {
      const date = expense.date;
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date: date,
          transaction_count: 0,
          total_amount: 0,
          descriptions: [],
          categories: []
        };
      }
      
      dailyStats[date].transaction_count++;
      dailyStats[date].total_amount += expense.amount;
      dailyStats[date].descriptions.push(expense.description);
      dailyStats[date].categories.push(expense.category);
    });
    
    // Convert to array and sort by date (newest first)
    const result = Object.values(dailyStats).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Format descriptions and categories as strings
    result.forEach(day => {
      day.descriptions = day.descriptions.join(' | ');
      day.categories = day.categories.join(' | ');
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Insights endpoint
app.get('/api/expenses/insights', async (req, res) => {
  try {
    const expenses = await db.getExpenses();
    
    if (expenses.length === 0) {
      return res.json({ 
        insights: "You haven't recorded any expenses yet. Start by adding some expenses to get personalized insights!",
        recommendations: ["Add your first expense to begin tracking", "Try saying 'I spent $25 on coffee' to get started"]
      });
    }

    let insights = '';
    let serviceUsed = 'fallback';

    // Try Anthropic first
    if (anthropicService.isAvailable) {
      try {
        const prompt = `Analyze the following expense data and provide intelligent insights, spending patterns, and personalized recommendations. Focus on trends, categories, amounts, and actionable advice.

Expense Data: ${JSON.stringify(expenses, null, 2)}

Please provide a structured analysis with:

**Key Spending Insights:**
- Highlight main spending patterns and trends
- Identify top spending categories
- Note any unusual or concerning patterns

**Category Analysis:**
- Break down spending by category
- Identify which categories are consuming most budget
- Highlight any category that seems excessive

**Recommendations & Actions:**
- Specific, actionable advice for each category
- Budget optimization suggestions
- Money-saving opportunities
- Areas for improvement

**Warnings & Concerns:**
- Any spending patterns that need attention
- Budget overruns or concerning trends
- Areas where spending seems excessive

**Positive Patterns:**
- Good financial habits observed
- Consistent tracking behaviors
- Areas where spending is well-controlled

Format each section with clear bullet points and actionable items. Be specific and provide concrete recommendations.`;

        const response = await anthropicService.anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        });

        insights = response.content[0].text;
        serviceUsed = 'anthropic';
      } catch (error) {
        console.log('Anthropic insights failed, trying OpenAI:', error.message);
      }
    }

    // Try OpenAI if Anthropic failed
    if (!insights && openaiService.isAvailable) {
      try {
        const prompt = `Analyze the following expense data and provide intelligent insights, spending patterns, and personalized recommendations. Focus on trends, categories, amounts, and actionable advice.

Expense Data: ${JSON.stringify(expenses, null, 2)}

Please provide a structured analysis with:

**Key Spending Insights:**
- Highlight main spending patterns and trends
- Identify top spending categories
- Note any unusual or concerning patterns

**Category Analysis:**
- Break down spending by category
- Identify which categories are consuming most budget
- Highlight any category that seems excessive

**Recommendations & Actions:**
- Specific, actionable advice for each category
- Budget optimization suggestions
- Money-saving opportunities
- Areas for improvement

**Warnings & Concerns:**
- Any spending patterns that need attention
- Budget overruns or concerning trends
- Areas where spending seems excessive

**Positive Patterns:**
- Good financial habits observed
- Consistent tracking behaviors
- Areas where spending is well-controlled

Format each section with clear bullet points and actionable items. Be specific and provide concrete recommendations.`;

        const response = await openaiService.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
          temperature: 0.7
        });

        insights = response.choices[0].message.content;
        serviceUsed = 'openai';
      } catch (error) {
        console.log('OpenAI insights failed, using fallback:', error.message);
      }
    }

    // Use fallback if both AI services failed
    if (!insights) {
      const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const categories = [...new Set(expenses.map(e => e.category))];
      const avgSpending = totalSpent / expenses.length;
      
      insights = `**Key Spending Insights:**
- Total expenses: ${expenses.length} transactions
- Total amount spent: $${totalSpent.toFixed(2)}
- Average per transaction: $${avgSpending.toFixed(2)}

**Category Analysis:**
- Spending categories: ${categories.join(', ')}
- Most frequent category: ${categories[0] || 'N/A'}

**Recommendations & Actions:**
- Set a monthly budget based on your current spending
- Track expenses more consistently for better insights
- Review spending patterns weekly
- Consider categorizing expenses more specifically

**Warnings & Concerns:**
- Limited data for comprehensive analysis
- Consider adding more expense categories
- Track expenses regularly for better insights

**Positive Patterns:**
- Good job on expense tracking
- Consistent data entry habits
- Organized expense categorization

This is a basic analysis. For more detailed AI-powered insights, ensure your API keys are properly configured.`;
      serviceUsed = 'fallback';
    }

    console.log(`✅ Insights generated with ${serviceUsed}`);
    res.json({ 
      insights,
      service: serviceUsed,
      expenseCount: expenses.length,
      totalSpent: expenses.reduce((sum, expense) => sum + expense.amount, 0)
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Track user connection metrics
  userConnections.inc();
  activeUsers.inc();
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    userDisconnections.inc();
    activeUsers.dec();
  });

  // Parse expense from natural language
  socket.on('parseExpense', async (data) => {
    try {
      console.log('Parsing expense:', data.message);
      console.log('Message length:', data.message.length);
      
      // Get user subscription preference
      const userSubscription = await getUserSubscription(data.userId || 'anonymous');
      console.log('User subscription:', userSubscription);
      
      // Check for rejection responses first - be more specific to avoid false positives
      const message = data.message.toLowerCase().trim();
      
      // Only reject if it's a clear, short rejection response
      const clearRejections = [
        'no', 'nope', 'nah', 'nay',
        'cancel', 'skip', 'ignore', 'pass',
        'dont', "don't", 'do not want',
        'reject', 'decline', 'refuse',
        'stop', 'quit', 'end', 'abort'
      ];
      
      // Check for exact matches or very short rejection phrases
      if (clearRejections.some(keyword => 
        message === keyword || 
        message === `"${keyword}"` ||
        (message.length <= 10 && message.includes(keyword))
      )) {
        console.log('❌ User rejected the expense');
        socket.emit('expenseRejected', { message: 'Expense not added' });
        return;
      }
      
      // Check if this is a query first (before trying to parse as expense)
      // More specific query patterns to avoid catching expense entries
      const queryPatterns = [
        /^show\s+(me\s+)?(my\s+)?(spending|expenses|summary)/i,
        /^what\s+(did\s+i\s+)?spend/i,
        /^what\s+(did\s+i\s+)?spent/i,
        /^how\s+much\s+(did\s+i\s+)?spend/i,
        /^how\s+much\s+(did\s+i\s+)?spent/i,
        /^tell\s+me\s+(about\s+)?(my\s+)?(spending|expenses)/i,
        /^display\s+(my\s+)?(spending|expenses)/i,
        /^summary/i,
        /^total\s+(spending|expenses)/i,
        /^breakdown/i,
        /^analytics/i,
        /^report/i,
        /^chart/i,
        /^graph/i,
        /^list\s+(all\s+)?(my\s+)?(expenses|spending)/i,
        /^all\s+(my\s+)?(expenses|spending)/i,
        /^clear\s+(all\s+)?(my\s+)?(expenses|spending)/i,
        /^what.*(last\s+month|this\s+month|yesterday|today)/i,
        /^how\s+much.*(last\s+month|this\s+month|yesterday|today)/i
      ];
      
      const isQuery = queryPatterns.some(pattern => pattern.test(message));
      
      if (isQuery) {
        console.log('🔍 Detected as query, processing...');
        console.log('📊 Optimization mode:', data.optimizeMode ? 'enabled' : 'disabled');
        console.log('💬 Conversation history length:', data.conversationHistory ? data.conversationHistory.length : 0);
        // Process as query instead of expense
        try {
          const expenses = await db.getExpenses();
          let queryResponse;
          let serviceUsed = 'fallback';

          // Try Anthropic first
          if (anthropicService.isAvailable) {
            try {
              queryResponse = await anthropicService.processQuery(data.message, expenses, data.conversationHistory, data.optimizeMode);
              serviceUsed = 'anthropic';
            } catch (error) {
              console.log('Anthropic query failed, trying OpenAI:', error.message);
            }
          }

          // Try OpenAI if Anthropic failed
          if (!queryResponse && openaiService.isAvailable) {
            try {
              queryResponse = await openaiService.processQuery(data.message, expenses, data.conversationHistory, data.optimizeMode);
              serviceUsed = 'openai';
            } catch (error) {
              console.log('OpenAI query failed, using fallback:', error.message);
            }
          }

          // Use fallback if both AI services failed
          if (!queryResponse) {
            queryResponse = anthropicService.fallbackProcessQuery(data.message, { expenses });
            serviceUsed = 'fallback';
          }

          console.log(`✅ Query processed with ${serviceUsed}:`, queryResponse);
          socket.emit('queryResponse', { response: queryResponse });
          return;
        } catch (error) {
          console.error('Error processing query:', error);
          socket.emit('queryError', { message: 'Failed to process query' });
          return;
        }
      }
      
      let parsedExpense;
      let serviceUsed = 'fallback';
      
      console.log('💰 Processing as expense...');
      console.log('📊 Optimization mode:', data.optimizeMode ? 'enabled' : 'disabled');
      console.log('💬 Conversation history length:', data.conversationHistory ? data.conversationHistory.length : 0);
      
      // Use AI services based on subscription plan
      if (userSubscription === 'free') {
        // Free mode - use fallback only
        console.log('🆓 Free mode - using fallback parsing');
        parsedExpense = anthropicService.fallbackParseExpense(data.message);
        serviceUsed = 'fallback';
      } else if (userSubscription === 'base') {
        // Base plan - use optimized AI
        console.log('⚡ Base plan - using optimized AI');
        const optimizeMode = true; // Force optimization for base plan
        
        // Try Anthropic first
        if (anthropicService.isAvailable) {
          try {
            parsedExpense = await anthropicService.parseExpense(data.message, data.conversationHistory, optimizeMode);
            serviceUsed = 'anthropic';
          } catch (error) {
            console.log('Anthropic failed, trying OpenAI:', error.message);
          }
        }
        
        // Try OpenAI if Anthropic failed
        if (!parsedExpense && openaiService.isAvailable) {
          try {
            parsedExpense = await openaiService.parseExpense(data.message, data.conversationHistory, optimizeMode);
            serviceUsed = 'openai';
          } catch (error) {
            console.log('OpenAI failed, using fallback:', error.message);
          }
        }
      } else if (userSubscription === 'premium') {
        // Premium plan - use full AI capabilities
        console.log('🚀 Premium plan - using full AI capabilities');
        
        // Try Anthropic first
        if (anthropicService.isAvailable) {
          try {
            parsedExpense = await anthropicService.parseExpense(data.message, data.conversationHistory, data.optimizeMode);
            serviceUsed = 'anthropic';
          } catch (error) {
            console.log('Anthropic failed, trying OpenAI:', error.message);
          }
        }
        
        // Try OpenAI if Anthropic failed
        if (!parsedExpense && openaiService.isAvailable) {
          try {
            parsedExpense = await openaiService.parseExpense(data.message, data.conversationHistory, data.optimizeMode);
            serviceUsed = 'openai';
          } catch (error) {
            console.log('OpenAI failed, using fallback:', error.message);
          }
        }
      }
      
      // Use fallback if both AI services failed
      if (!parsedExpense) {
        parsedExpense = anthropicService.fallbackParseExpense(data.message);
        serviceUsed = 'fallback';
      }
      
      // Ensure all required fields are present
      if (parsedExpense) {
        parsedExpense.description = parsedExpense.description || 'expense';
        parsedExpense.amount = parsedExpense.amount || 0;
        parsedExpense.category = parsedExpense.category || 'other';
        parsedExpense.date = parsedExpense.date || new Date().toISOString().split('T')[0];
      }
      
      console.log(`✅ Parsed with ${serviceUsed}:`, parsedExpense);
      
      // Validate parsed expense before sending
      if (!parsedExpense || !parsedExpense.description || !parsedExpense.amount || !parsedExpense.category) {
        console.log('❌ Invalid parsed expense:', parsedExpense);
        socket.emit('parseError', { message: 'Failed to parse expense details' });
        return;
      }
      
      socket.emit('expenseParsed', { 
        expense: parsedExpense, 
        service: serviceUsed 
      });
      
    } catch (error) {
      console.error('Error parsing expense:', error);
      socket.emit('error', { message: 'Failed to parse expense' });
    }
  });

  // Process query
  socket.on('processQuery', async (data) => {
    try {
      console.log('Processing query:', data.message);
      
      let response;
      let serviceUsed = 'fallback';
      
      // Try Anthropic first
      if (anthropicService.isAvailable) {
        try {
          response = await anthropicService.processQuery(data.message, data.expenses || []);
          serviceUsed = 'anthropic';
        } catch (error) {
          console.log('Anthropic failed, trying OpenAI:', error.message);
        }
      }
      
      // Try OpenAI if Anthropic failed
      if (!response && openaiService.isAvailable) {
        try {
          response = await openaiService.processQuery(data.message, data.expenses || []);
          serviceUsed = 'openai';
        } catch (error) {
          console.log('OpenAI failed, using fallback:', error.message);
        }
      }
      
      // Use fallback if both AI services failed
      if (!response) {
        response = anthropicService.fallbackProcessQuery(data.message, data.expenses || []);
        serviceUsed = 'fallback';
      }
      
      console.log(`✅ Query processed with ${serviceUsed}:`, response);
      socket.emit('queryResponse', { 
        response, 
        service: serviceUsed 
      });
      
    } catch (error) {
      console.error('Error processing query:', error);
      socket.emit('error', { message: 'Failed to process query' });
    }
  });

  // Save expense
  socket.on('saveExpense', async (data) => {
    const startTime = Date.now();
    try {
      console.log('💾 Save expense request received:', data);
      
      // Track database operation
      const dbStartTime = Date.now();
      const expense = await db.addExpense(data);
      const dbResponseTime = (Date.now() - dbStartTime) / 1000;
      
      databaseOperations.inc({ operation: 'add_expense', table: 'expenses', status: 'success' });
      databaseResponseTime.observe({ operation: 'add_expense', table: 'expenses' }, dbResponseTime);
      
      // Track business metrics
      totalExpenses.inc({ category: data.category, user_id: socket.id });
      totalExpenseAmount.inc({ category: data.category, user_id: socket.id }, data.amount);
      expensesByCategory.inc({ category: data.category });
      
      console.log('✅ Expense saved:', expense);
      socket.emit('expenseSaved', expense);
      socket.broadcast.emit('expenseAdded', expense);
    } catch (error) {
      console.error('Error saving expense:', error);
      databaseOperations.inc({ operation: 'add_expense', table: 'expenses', status: 'error' });
      socket.emit('error', { message: 'Failed to save expense' });
    } finally {
      const totalResponseTime = (Date.now() - startTime) / 1000;
      apiResponseTime.observe({ method: 'socket', endpoint: 'saveExpense' }, totalResponseTime);
    }
  });
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
  
  // Log server startup to file
  logger.info('🚀 HAL\'s Penny server started successfully', {
    port: PORT,
    timestamp: new Date().toISOString(),
    services: {
      anthropic: anthropicService.isAvailable ? 'available' : 'unavailable',
      openai: openaiService.isAvailable ? 'available' : 'unavailable'
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

class AnthropicService {
  constructor() {
    // Try to initialize Anthropic, but don't fail if API key is missing
    try {
      if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.isAvailable = true;
        console.log('✅ Anthropic Claude API initialized successfully');
      } else {
        this.isAvailable = false;
        console.log('⚠️  Anthropic API key not configured. Using fallback parsing only.');
      }
    } catch (error) {
      this.isAvailable = false;
      console.log('⚠️  Anthropic initialization failed. Using fallback parsing only.');
    }
  }

  // Parse expense from natural language using Claude
  async parseExpense(message, optimizeMode = false) {
    // If Anthropic is not available, use fallback immediately
    if (!this.isAvailable) {
      return this.fallbackParseExpense(message);
    }
    
    try {
      const prompt = optimizeMode 
        ? `Parse: "${message}" → JSON: { "description": "string", "amount": number, "category": "string", "date": "2024-01-15" }`
        : `Parse the following message and extract expense information. Return a JSON object with:
        - description: string (what was purchased)
        - amount: number (the cost)
        - category: string (one of: food, transport, shopping, entertainment, bills, healthcare, education, other)
        - date: string (YYYY-MM-DD format, use today's date if not specified, example: 2024-01-15)

        Message: "${message}"

        Examples:
        "I spent $30 on lunch" -> {"description": "lunch", "amount": 30, "category": "food", "date": "2024-01-15"}
        "Bought groceries for $85.50" -> {"description": "groceries", "amount": 85.50, "category": "food", "date": "2024-01-15"}
        "Gas station $45" -> {"description": "gas", "amount": 45, "category": "transport", "date": "2024-01-15"}

        Return only the JSON object, no other text.`;

      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307", // Fast and cost-effective model
        max_tokens: optimizeMode ? 100 : 200,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0].text;
      const parsedExpense = JSON.parse(content);
      
      // Fix date if it's a placeholder or invalid
      if (!parsedExpense.date || 
          parsedExpense.date === 'YYYY-MM-DD' || 
          parsedExpense.date === '2024-01-15' ||
          parsedExpense.date.includes('YYYY') ||
          parsedExpense.date.includes('MM') ||
          parsedExpense.date.includes('DD')) {
        parsedExpense.date = new Date().toISOString().split('T')[0];
      }
      
      // Validate the parsed expense
      if (!parsedExpense.description || !parsedExpense.amount || !parsedExpense.category) {
        throw new Error('Invalid expense data from Claude');
      }

      return parsedExpense;
    } catch (error) {
      console.error('Error parsing expense with Claude:', error);
      // Re-throw the error so the server can handle the fallback
      throw error;
    }
  }

  // Process query and generate response using Claude
  async processQuery(query, expenseData, conversationHistory = [], optimizeMode = false) {
    // If Anthropic is not available, use fallback immediately
    if (!this.isAvailable) {
      return this.fallbackProcessQuery(query, expenseData);
    }
    
    try {
      // Build conversation context
      const messages = [];
      
      // Add conversation history for context (limit in optimize mode)
      if (conversationHistory && conversationHistory.length > 0) {
        const historyLimit = optimizeMode ? 3 : 10;
        conversationHistory.slice(-historyLimit).forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        });
      }
      
      // Add the current query with context (optimized for token usage)
      const prompt = optimizeMode 
        ? `Query: "${query}" Data: ${JSON.stringify(expenseData)}. Respond briefly.`
        : `You are an AI assistant for expense tracking. Based on the user's query and the provided expense data, provide a helpful response.

        User Query: "${query}"

        Expense Data: ${JSON.stringify(expenseData, null, 2)}

        Provide a natural, conversational response that:
        1. Answers the user's question directly
        2. Includes relevant statistics and insights
        3. Suggests actionable advice if appropriate
        4. Is friendly and helpful
        5. References previous conversation context when relevant

        Keep the response concise but informative.`;
      
      messages.push({
        role: "user",
        content: prompt
      });

      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: optimizeMode ? 150 : 500,
        messages: messages,
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Error processing query with Claude:', error);
      // Re-throw the error so the server can handle the fallback
      throw error;
    }
  }

  // Classify whether a message is a query or expense entry
  async classifyMessage(message, conversationHistory = [], optimizeMode = false) {
    if (!this.isAvailable) {
      // Fallback classification when API is not available
      return this.fallbackClassifyMessage(message);
    }

    try {
      // Build conversation context
      const messages = [];
      
      // Add conversation history for context (limit in optimize mode)
      if (conversationHistory && conversationHistory.length > 0) {
        const historyLimit = optimizeMode ? 3 : 10;
        conversationHistory.slice(-historyLimit).forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        });
      }
      
      // Add the classification prompt (optimized for token usage)
      const prompt = optimizeMode 
        ? `Classify: "${message}" as "expense" or "query". Respond with one word.`
        : `Classify this message as either "expense" or "query". 
        
        Examples:
        - "I spent $30 on lunch" → expense
        - "What did I spend on food?" → query
        - "Show me my spending summary" → query
        - "I bought coffee for $5" → expense
        - "Clear all my expenses" → query
        - "How much did I spend this month?" → query
        
        Message: "${message}"
        
        Respond with only "expense" or "query":`;
      
      messages.push({
        role: "user",
        content: prompt
      });

      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: optimizeMode ? 10 : 50,
        messages: messages
      });

      const classification = response.content[0].text.trim().toLowerCase();
      return classification === 'query' ? 'query' : 'expense';
    } catch (error) {
      console.error('Error classifying message with Claude:', error);
      return this.fallbackClassifyMessage(message);
    }
  }

  // Fallback classification using keyword matching
  fallbackClassifyMessage(message) {
    const queryKeywords = [
      'clear all', 'delete all', 'remove all', 'total expense', 'spending summary', 
      'show me', 'what is', 'how much', 'give me', 'display', 'chart', 'graph',
      'category', 'breakdown', 'summary', 'report', 'analytics', 'show all',
      'list all', 'get all', 'view all', 'see all', 'all my', 'my expense',
      'my expenses', 'expense list', 'expenses list', 'spending list',
      'what', 'how', 'where', 'when', 'why', 'which', 'who',
      'spent on', 'spent for', 'spent at', 'spending on', 'spending for',
      'cost of', 'price of', 'amount of', 'total of', 'sum of',
      'tell me', 'can you', 'could you', 'would you', 'please show',
      'i want to know', 'i need to know', 'help me find'
    ];
    
    const isQuery = queryKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    return isQuery ? 'query' : 'expense';
  }

  // Fallback parsing using regex (same as before)
  fallbackParseExpense(message) {
    console.log('Using fallback parsing for:', message);
    
    // Extract amount using regex
    const amountMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    // Extract description (remove amount and common words)
    let description = message
      .replace(/\$?\d+(?:\.\d{2})?/g, '') // Remove amounts
      .replace(/\b(spent|bought|paid|cost|expense|on|for|at)\b/gi, '') // Remove common words
      .trim();
    
    if (!description) {
      description = 'expense';
    }
    
    // Determine category based on keywords
    const categoryKeywords = {
      food: ['lunch', 'dinner', 'breakfast', 'coffee', 'food', 'restaurant', 'grocery', 'meal', 'snack'],
      transport: ['gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'transport', 'parking'],
      shopping: ['shirt', 'clothes', 'shopping', 'store', 'amazon', 'purchase'],
      entertainment: ['movie', 'game', 'entertainment', 'fun', 'hobby'],
      bills: ['bill', 'rent', 'electricity', 'water', 'internet', 'phone'],
      healthcare: ['doctor', 'medicine', 'health', 'medical', 'pharmacy'],
      education: ['book', 'course', 'education', 'school', 'learning']
    };
    
    let category = 'other';
    const lowerMessage = message.toLowerCase();
    
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        category = cat;
        break;
      }
    }
    
    // Try to extract date from message, otherwise use today's date
    let date = new Date().toISOString().split('T')[0];
    
    // Look for date patterns in the message
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
      /(\d{1,2}\/\d{1,2}\/\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
      /(\d{1,2}-\d{1,2}-\d{4})/, // MM-DD-YYYY or DD-MM-YYYY
      /(today|yesterday|tomorrow)/i
    ];
    
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        if (match[1].toLowerCase() === 'today') {
          date = new Date().toISOString().split('T')[0];
        } else if (match[1].toLowerCase() === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          date = yesterday.toISOString().split('T')[0];
        } else if (match[1].toLowerCase() === 'tomorrow') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          date = tomorrow.toISOString().split('T')[0];
        } else {
          // Try to parse the matched date
          const parsedDate = new Date(match[1]);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString().split('T')[0];
          }
        }
        break;
      }
    }
    
    return {
      description,
      amount,
      category,
      date
    };
  }

  // Fallback query processing
  fallbackProcessQuery(query, expenseData) {
    console.log('Using fallback query processing for:', query);
    
    const lowerQuery = query.toLowerCase();
    
    // Get expenses array from the data object
    const expenses = expenseData.expenses || [];
    
    // Calculate basic statistics
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    // Generate response based on query keywords
    if (lowerQuery.includes('total') || lowerQuery.includes('spent')) {
      return `Your total expenses are $${total.toFixed(2)}. Here's the breakdown by category: ${Object.entries(categoryTotals).map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`).join(', ')}.`;
    }
    
    if (lowerQuery.includes('food') || lowerQuery.includes('lunch') || lowerQuery.includes('dinner')) {
      const foodTotal = categoryTotals.food || 0;
      return `You've spent $${foodTotal.toFixed(2)} on food. ${foodTotal > 0 ? 'Consider tracking your food expenses to better manage your budget.' : 'No food expenses found.'}`;
    }
    
    if (lowerQuery.includes('category') || lowerQuery.includes('categories')) {
      const categories = Object.keys(categoryTotals);
      return `Your expense categories are: ${categories.join(', ')}. Your highest spending category is ${Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'}.`;
    }
    
    return `I found ${expenseData.length} expenses totaling $${total.toFixed(2)}. Your top spending category is ${Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'}.`;
  }
}

module.exports = AnthropicService;

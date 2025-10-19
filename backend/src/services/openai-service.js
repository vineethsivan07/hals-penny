const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    // Try to initialize OpenAI, but don't fail if API key is missing or quota exceeded
    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.isAvailable = true;
      } else {
        this.isAvailable = false;
        console.log('⚠️  OpenAI API key not configured. Using fallback parsing only.');
      }
    } catch (error) {
      this.isAvailable = false;
      console.log('⚠️  OpenAI initialization failed. Using fallback parsing only.');
    }
  }

  // Parse expense from natural language
  async parseExpense(message, optimizeMode = false) {
    // If OpenAI is not available, use fallback immediately
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

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: optimizeMode ? 100 : 200
      });

      const content = response.choices[0].message.content.trim();
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
      
      return parsedExpense;
    } catch (error) {
      console.error('Error parsing expense:', error);
      
      // Re-throw the error so the server can handle the fallback
      throw error;
    }
  }

  // Fallback parsing when OpenAI is unavailable
  fallbackParseExpense(message) {
    const today = new Date().toISOString().split('T')[0];
    
    // Extract amount using regex
    const amountMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    // Extract description (remove amount and common words)
    let description = message
      .replace(/\$?\d+(?:\.\d{2})?/g, '') // Remove amounts
      .replace(/\b(spent|bought|paid|cost|on|for|at)\b/gi, '') // Remove common words
      .trim();
    
    if (!description) {
      description = 'expense';
    }
    
    // Simple category detection
    let category = 'other';
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('food') || lowerMessage.includes('lunch') || lowerMessage.includes('dinner') || 
        lowerMessage.includes('breakfast') || lowerMessage.includes('restaurant') || lowerMessage.includes('cafe') ||
        lowerMessage.includes('coffee') || lowerMessage.includes('grocery') || lowerMessage.includes('meal')) {
      category = 'food';
    } else if (lowerMessage.includes('gas') || lowerMessage.includes('fuel') || lowerMessage.includes('transport') ||
               lowerMessage.includes('uber') || lowerMessage.includes('taxi') || lowerMessage.includes('bus')) {
      category = 'transport';
    } else if (lowerMessage.includes('shopping') || lowerMessage.includes('store') || lowerMessage.includes('mall') ||
               lowerMessage.includes('amazon') || lowerMessage.includes('clothes') || lowerMessage.includes('shirt')) {
      category = 'shopping';
    } else if (lowerMessage.includes('movie') || lowerMessage.includes('entertainment') || lowerMessage.includes('game') ||
               lowerMessage.includes('netflix') || lowerMessage.includes('spotify')) {
      category = 'entertainment';
    } else if (lowerMessage.includes('bill') || lowerMessage.includes('electric') || lowerMessage.includes('water') ||
               lowerMessage.includes('internet') || lowerMessage.includes('phone')) {
      category = 'bills';
    } else if (lowerMessage.includes('doctor') || lowerMessage.includes('hospital') || lowerMessage.includes('medicine') ||
               lowerMessage.includes('pharmacy') || lowerMessage.includes('health')) {
      category = 'healthcare';
    } else if (lowerMessage.includes('book') || lowerMessage.includes('course') || lowerMessage.includes('education') ||
               lowerMessage.includes('school') || lowerMessage.includes('university')) {
      category = 'education';
    }
    
    return {
      description,
      amount,
      category,
      date: today
    };
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

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.1,
        max_tokens: optimizeMode ? 5 : 10
      });

      const classification = response.choices[0].message.content.trim().toLowerCase();
      return classification === 'query' ? 'query' : 'expense';
    } catch (error) {
      console.error('Error classifying message with OpenAI:', error);
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

  // Process query and generate response
  async processQuery(query, expenseData, conversationHistory = [], optimizeMode = false) {
    // If OpenAI is not available, use fallback immediately
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
        : `You are HAL's Penny, a professional financial advisor specializing in personal finance and expense analysis. Based on the user's query and their expense data, provide expert financial guidance.

        User Query: "${query}"

        Expense Data: ${JSON.stringify(expenseData, null, 2)}

        As their financial advisor, provide a professional response that:
        1. Answers their financial question with expertise
        2. Analyzes their spending patterns and provides insights
        3. Offers strategic financial advice and recommendations
        4. Maintains a professional yet approachable tone
        5. Focuses on helping them make informed financial decisions
        6. References previous conversation context when relevant

        Keep the response concise but informative.`;
      
      messages.push({
        role: "user",
        content: prompt
      });

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
        max_tokens: optimizeMode ? 150 : 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error processing query:', error);
      
      // Re-throw the error so the server can handle the fallback
      throw error;
    }
  }

  // Fallback query processing when OpenAI is unavailable
  fallbackProcessQuery(query, expenseData) {
    const lowerQuery = query.toLowerCase();
    
    // Calculate basic statistics
    const totalExpenses = expenseData.expenses ? expenseData.expenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;
    const expenseCount = expenseData.expenses ? expenseData.expenses.length : 0;
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;
    
    // Category breakdown
    const categoryTotals = {};
    if (expenseData.expenses) {
      expenseData.expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      });
    }
    
    const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
      categoryTotals[a] > categoryTotals[b] ? a : b, 'other'
    );
    
    // Generate responses based on query keywords
    if (lowerQuery.includes('total') || lowerQuery.includes('spent')) {
      return `Based on your financial analysis, you have spent a total of $${totalExpenses.toFixed(2)} across ${expenseCount} transactions, with an average of $${averageExpense.toFixed(2)} per expense. As your financial advisor, I recommend reviewing these patterns to ensure they align with your budget goals.`;
    }
    
    if (lowerQuery.includes('food') || lowerQuery.includes('dining')) {
      const foodTotal = categoryTotals.food || 0;
      return `Your food and dining expenses total $${foodTotal.toFixed(2)}, representing ${totalExpenses > 0 ? ((foodTotal/totalExpenses)*100).toFixed(1) : 0}% of your total expenses. As your financial advisor, I suggest monitoring this category closely as it often represents a significant portion of discretionary spending.`;
    }
    
    if (lowerQuery.includes('month') || lowerQuery.includes('monthly')) {
      return `Your monthly financial summary shows $${totalExpenses.toFixed(2)} total across ${expenseCount} transactions, with ${topCategory} being your highest spending category. I recommend analyzing this pattern to optimize your monthly budget allocation.`;
    }
    
    if (lowerQuery.includes('category') || lowerQuery.includes('categories')) {
      const categoryList = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`)
        .join(', ');
      return `Here's your spending analysis by category: ${categoryList}. As your financial advisor, I recommend reviewing these allocations to ensure they support your financial objectives.`;
    }
    
    if (lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
      return `Financial Summary: $${totalExpenses.toFixed(2)} total across ${expenseCount} transactions, averaging $${averageExpense.toFixed(2)} per expense. Your primary spending category is ${topCategory}. As your financial advisor, I suggest reviewing these patterns to identify opportunities for financial optimization.`;
    }
    
    // Default response
    return `I've analyzed your financial data and found ${expenseCount} expenses totaling $${totalExpenses.toFixed(2)}. Your top spending category is ${topCategory}. As your financial advisor, I'm here to help you optimize your financial strategy. What specific aspect would you like to explore?`;
  }

  // Generate chart data description
  async generateChartDescription(chartData, chartType) {
    try {
      const prompt = `
        Based on the following ${chartType} chart data, provide a brief, insightful description of the spending patterns:

        Chart Data: ${JSON.stringify(chartData, null, 2)}

        Provide a 1-2 sentence summary highlighting the key insights or trends.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating chart description:', error);
      return "Chart data visualization";
    }
  }

  // Categorize expense automatically
  async categorizeExpense(description, amount) {
    try {
      const prompt = `
        Categorize this expense based on its description and amount. Choose the most appropriate category from: food, transport, shopping, entertainment, bills, healthcare, education, other.

        Description: "${description}"
        Amount: $${amount}

        Return only the category name, nothing else.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      });

      return response.choices[0].message.content.trim().toLowerCase();
    } catch (error) {
      console.error('Error categorizing expense:', error);
      return 'other';
    }
  }
}

module.exports = OpenAIService;

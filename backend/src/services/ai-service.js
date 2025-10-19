/**
 * AI Service
 * Production-ready AI service with proper error handling and logging
 */

const AnthropicService = require('./anthropic-service');
const OpenAIService = require('./openai-service');
const { logger, performanceLogger, businessLogger } = require('../config/logger');
const config = require('../config/environment');

class AIService {
  constructor() {
    this.anthropicService = new AnthropicService();
    this.openaiService = new OpenAIService();
    this.logger = logger.child({ component: 'AIService' });
  }

  /**
   * Parse expense from natural language with fallback
   * @param {string} message - User message
   * @param {Object} context - Additional context
   * @returns {Object} Parsed expense data
   */
  async parseExpense(message, context = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting expense parsing', {
        messageLength: message.length,
        hasContext: Object.keys(context).length > 0
      });

      // Try Anthropic first
      if (this.anthropicService.isAvailable()) {
        try {
          const result = await this.anthropicService.parseExpense(message, context);
          const duration = Date.now() - startTime;
          
          performanceLogger('ai_parse_expense', duration, {
            service: 'anthropic',
            success: true
          });

          businessLogger('expense_parsed', 'ai', {
            service: 'anthropic',
            messageLength: message.length,
            duration
          });

          return result;
        } catch (error) {
          this.logger.warn('Anthropic parsing failed, trying OpenAI', {
            error: error.message,
            messageLength: message.length
          });
        }
      }

      // Try OpenAI as fallback
      if (this.openaiService.isAvailable()) {
        try {
          const result = await this.openaiService.parseExpense(message, context);
          const duration = Date.now() - startTime;
          
          performanceLogger('ai_parse_expense', duration, {
            service: 'openai',
            success: true
          });

          businessLogger('expense_parsed', 'ai', {
            service: 'openai',
            messageLength: message.length,
            duration
          });

          return result;
        } catch (error) {
          this.logger.warn('OpenAI parsing failed, using regex fallback', {
            error: error.message,
            messageLength: message.length
          });
        }
      }

      // Use regex fallback
      const result = await this._fallbackParseExpense(message);
      const duration = Date.now() - startTime;
      
      performanceLogger('ai_parse_expense', duration, {
        service: 'regex_fallback',
        success: true
      });

      businessLogger('expense_parsed', 'ai', {
        service: 'regex_fallback',
        messageLength: message.length,
        duration
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('All AI parsing methods failed', {
        error: error.message,
        messageLength: message.length,
        duration
      });

      performanceLogger('ai_parse_expense', duration, {
        service: 'all_failed',
        success: false,
        error: error.message
      });

      throw new Error('Unable to parse expense. Please try rephrasing your message.');
    }
  }

  /**
   * Process query with AI services
   * @param {string} query - User query
   * @param {Object} expenseData - Available expense data
   * @param {Object} context - Additional context
   * @returns {string} AI response
   */
  async processQuery(query, expenseData, context = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Processing query with AI', {
        queryLength: query.length,
        expenseCount: expenseData?.expenses?.length || 0,
        hasContext: Object.keys(context).length > 0
      });

      // Try Anthropic first
      if (this.anthropicService.isAvailable()) {
        try {
          const result = await this.anthropicService.processQuery(query, expenseData, context);
          const duration = Date.now() - startTime;
          
          performanceLogger('ai_process_query', duration, {
            service: 'anthropic',
            success: true
          });

          businessLogger('query_processed', 'ai', {
            service: 'anthropic',
            queryLength: query.length,
            duration
          });

          return result;
        } catch (error) {
          this.logger.warn('Anthropic query processing failed, trying OpenAI', {
            error: error.message,
            queryLength: query.length
          });
        }
      }

      // Try OpenAI as fallback
      if (this.openaiService.isAvailable()) {
        try {
          const result = await this.openaiService.processQuery(query, expenseData, context);
          const duration = Date.now() - startTime;
          
          performanceLogger('ai_process_query', duration, {
            service: 'openai',
            success: true
          });

          businessLogger('query_processed', 'ai', {
            service: 'openai',
            queryLength: query.length,
            duration
          });

          return result;
        } catch (error) {
          this.logger.warn('OpenAI query processing failed, using fallback', {
            error: error.message,
            queryLength: query.length
          });
        }
      }

      // Use fallback response
      const result = await this._fallbackProcessQuery(query, expenseData);
      const duration = Date.now() - startTime;
      
      performanceLogger('ai_process_query', duration, {
        service: 'fallback',
        success: true
      });

      businessLogger('query_processed', 'ai', {
        service: 'fallback',
        queryLength: query.length,
        duration
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('All AI query processing methods failed', {
        error: error.message,
        queryLength: query.length,
        duration
      });

      performanceLogger('ai_process_query', duration, {
        service: 'all_failed',
        success: false,
        error: error.message
      });

      return 'I apologize, but I\'m having trouble processing your request right now. Please try again later.';
    }
  }

  /**
   * Classify message type (expense vs query)
   * @param {string} message - User message
   * @returns {string} Message type ('expense' or 'query')
   */
  async classifyMessage(message) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Classifying message type', {
        messageLength: message.length
      });

      // Try Anthropic first
      if (this.anthropicService.isAvailable()) {
        try {
          const result = await this.anthropicService.classifyMessage(message);
          const duration = Date.now() - startTime;
          
          performanceLogger('ai_classify_message', duration, {
            service: 'anthropic',
            success: true,
            classification: result
          });

          return result;
        } catch (error) {
          this.logger.warn('Anthropic classification failed, trying OpenAI', {
            error: error.message
          });
        }
      }

      // Try OpenAI as fallback
      if (this.openaiService.isAvailable()) {
        try {
          const result = await this.openaiService.classifyMessage(message);
          const duration = Date.now() - startTime;
          
          performanceLogger('ai_classify_message', duration, {
            service: 'openai',
            success: true,
            classification: result
          });

          return result;
        } catch (error) {
          this.logger.warn('OpenAI classification failed, using keyword fallback', {
            error: error.message
          });
        }
      }

      // Use keyword-based fallback
      const result = this._keywordClassification(message);
      const duration = Date.now() - startTime;
      
      performanceLogger('ai_classify_message', duration, {
        service: 'keyword_fallback',
        success: true,
        classification: result
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('All classification methods failed', {
        error: error.message,
        messageLength: message.length,
        duration
      });

      performanceLogger('ai_classify_message', duration, {
        service: 'all_failed',
        success: false,
        error: error.message
      });

      // Default to query if all methods fail
      return 'query';
    }
  }

  /**
   * Regex-based expense parsing fallback
   * @private
   */
  async _fallbackParseExpense(message) {
    const amountMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
    
    if (!amount) {
      throw new Error('No amount found in message');
    }

    // Extract description (everything except amount)
    const description = message.replace(/\$?\d+(?:\.\d{2})?/, '').trim();
    
    // Simple category detection
    const categoryKeywords = {
      'food': ['lunch', 'dinner', 'breakfast', 'coffee', 'restaurant', 'food', 'meal'],
      'transport': ['gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'flight', 'parking'],
      'entertainment': ['movie', 'cinema', 'game', 'concert', 'show', 'entertainment'],
      'shopping': ['store', 'shop', 'purchase', 'buy', 'clothes', 'shopping'],
      'utilities': ['electric', 'water', 'internet', 'phone', 'utility', 'bill'],
      'healthcare': ['doctor', 'hospital', 'medicine', 'pharmacy', 'health', 'medical'],
      'other': []
    };

    let category = 'other';
    const lowerMessage = message.toLowerCase();
    
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        category = cat;
        break;
      }
    }

    return {
      amount,
      description: description || 'Expense',
      category,
      date: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Fallback query processing
   * @private
   */
  async _fallbackProcessQuery(query, expenseData) {
    const expenses = expenseData?.expenses || [];
    
    if (expenses.length === 0) {
      return 'You don\'t have any expenses recorded yet. Try adding one by saying something like "I spent $30 on lunch".';
    }

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];

    return `You have ${expenses.length} expenses totaling $${totalAmount.toFixed(2)}. Your top spending category is ${topCategory[0]} with $${topCategory[1].toFixed(2)}.`;
  }

  /**
   * Keyword-based message classification
   * @private
   */
  _keywordClassification(message) {
    const queryKeywords = [
      'what', 'how', 'where', 'when', 'why', 'which', 'who',
      'show', 'tell', 'list', 'get', 'find', 'search',
      'total', 'sum', 'amount', 'spent', 'spending',
      'summary', 'report', 'analytics', 'breakdown'
    ];

    const expenseKeywords = [
      'spent', 'bought', 'purchased', 'paid', 'cost',
      'expense', 'expenditure', 'bill', 'receipt'
    ];

    const lowerMessage = message.toLowerCase();

    const hasQueryKeywords = queryKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasExpenseKeywords = expenseKeywords.some(keyword => lowerMessage.includes(keyword));

    if (hasQueryKeywords && !hasExpenseKeywords) {
      return 'query';
    } else if (hasExpenseKeywords || /\$?\d+(?:\.\d{2})?/.test(message)) {
      return 'expense';
    } else {
      return 'query'; // Default to query for ambiguous cases
    }
  }

  /**
   * Get service health status
   * @returns {Object} Health status of all AI services
   */
  getHealthStatus() {
    return {
      anthropic: {
        available: this.anthropicService.isAvailable(),
        status: this.anthropicService.isAvailable() ? 'healthy' : 'unavailable'
      },
      openai: {
        available: this.openaiService.isAvailable(),
        status: this.openaiService.isAvailable() ? 'healthy' : 'unavailable'
      },
      fallback: {
        available: true,
        status: 'healthy'
      }
    };
  }
}

module.exports = AIService;

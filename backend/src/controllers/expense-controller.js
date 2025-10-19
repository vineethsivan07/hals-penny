/**
 * Expense Controller
 * Production-ready controller with proper error handling and validation
 */

const ExpenseModel = require('../models/expense');
const AIService = require('../services/ai-service');
const { logger, businessLogger } = require('../config/logger');

class ExpenseController {
  constructor(database) {
    this.expenseModel = new ExpenseModel(database);
    this.aiService = new AIService();
    this.logger = logger.child({ component: 'ExpenseController' });
  }

  /**
   * Get all expenses with filtering and pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getExpenses(req, res) {
    try {
      const { page, limit, category, startDate, endDate, minAmount, maxAmount, search, sortBy, sortOrder } = req.query;
      const userId = req.user?.uid || 'anonymous';

      const filters = {
        category,
        startDate,
        endDate,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        search
      };

      const pagination = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
        sortBy: sortBy || 'date',
        sortOrder: sortOrder || 'DESC'
      };

      // Validate pagination
      if (pagination.page < 1 || pagination.limit < 1 || pagination.limit > 100) {
        return res.status(400).json({
          error: 'Invalid pagination parameters',
          message: 'Page must be >= 1, limit must be between 1 and 100'
        });
      }

      const result = await this.expenseModel.getExpenses(filters, userId, pagination);

      this.logger.info('Expenses retrieved successfully', {
        userId,
        count: result.expenses.length,
        totalCount: result.pagination.totalCount,
        page: result.pagination.page
      });

      res.json(result);
    } catch (error) {
      this.logger.error('Failed to get expenses', {
        error: error.message,
        userId: req.user?.uid,
        query: req.query
      });

      res.status(500).json({
        error: 'Failed to retrieve expenses',
        message: 'An internal error occurred while fetching expenses'
      });
    }
  }

  /**
   * Get expense by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getExpenseById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.uid || 'anonymous';

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Invalid expense ID',
          message: 'Expense ID must be a valid number'
        });
      }

      const expense = await this.expenseModel.getExpenseById(parseInt(id), userId);

      if (!expense) {
        return res.status(404).json({
          error: 'Expense not found',
          message: 'The requested expense does not exist or you do not have permission to view it'
        });
      }

      this.logger.info('Expense retrieved successfully', {
        expenseId: id,
        userId
      });

      res.json(expense);
    } catch (error) {
      this.logger.error('Failed to get expense by ID', {
        error: error.message,
        expenseId: req.params.id,
        userId: req.user?.uid
      });

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to access this expense'
        });
      }

      res.status(500).json({
        error: 'Failed to retrieve expense',
        message: 'An internal error occurred while fetching the expense'
      });
    }
  }

  /**
   * Create new expense
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createExpense(req, res) {
    try {
      const userId = req.user?.uid || 'anonymous';
      const expenseData = req.body;

      if (!expenseData || Object.keys(expenseData).length === 0) {
        return res.status(400).json({
          error: 'Invalid request body',
          message: 'Expense data is required'
        });
      }

      const expense = await this.expenseModel.createExpense(expenseData, userId);

      this.logger.info('Expense created successfully', {
        expenseId: expense.id,
        userId,
        amount: expense.amount,
        category: expense.category
      });

      businessLogger('expense_created', 'expense', {
        expenseId: expense.id,
        userId,
        amount: expense.amount,
        category: expense.category
      });

      res.status(201).json(expense);
    } catch (error) {
      this.logger.error('Failed to create expense', {
        error: error.message,
        userId: req.user?.uid,
        expenseData: req.body
      });

      if (error.message.includes('Validation error')) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Failed to create expense',
        message: 'An internal error occurred while creating the expense'
      });
    }
  }

  /**
   * Update expense
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateExpense(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.uid || 'anonymous';
      const updateData = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Invalid expense ID',
          message: 'Expense ID must be a valid number'
        });
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'Invalid request body',
          message: 'Update data is required'
        });
      }

      const expense = await this.expenseModel.updateExpense(parseInt(id), updateData, userId);

      this.logger.info('Expense updated successfully', {
        expenseId: id,
        userId,
        changes: Object.keys(updateData)
      });

      businessLogger('expense_updated', 'expense', {
        expenseId: id,
        userId,
        changes: Object.keys(updateData)
      });

      res.json(expense);
    } catch (error) {
      this.logger.error('Failed to update expense', {
        error: error.message,
        expenseId: req.params.id,
        userId: req.user?.uid,
        updateData: req.body
      });

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Expense not found',
          message: 'The requested expense does not exist'
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to update this expense'
        });
      }

      if (error.message.includes('Validation error')) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Failed to update expense',
        message: 'An internal error occurred while updating the expense'
      });
    }
  }

  /**
   * Delete expense
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteExpense(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.uid || 'anonymous';

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Invalid expense ID',
          message: 'Expense ID must be a valid number'
        });
      }

      await this.expenseModel.deleteExpense(parseInt(id), userId);

      this.logger.info('Expense deleted successfully', {
        expenseId: id,
        userId
      });

      businessLogger('expense_deleted', 'expense', {
        expenseId: id,
        userId
      });

      res.status(204).send();
    } catch (error) {
      this.logger.error('Failed to delete expense', {
        error: error.message,
        expenseId: req.params.id,
        userId: req.user?.uid
      });

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Expense not found',
          message: 'The requested expense does not exist'
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to delete this expense'
        });
      }

      res.status(500).json({
        error: 'Failed to delete expense',
        message: 'An internal error occurred while deleting the expense'
      });
    }
  }

  /**
   * Clear all expenses for user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async clearExpenses(req, res) {
    try {
      const userId = req.user?.uid || 'anonymous';

      const deletedCount = await this.expenseModel.clearUserExpenses(userId);

      this.logger.info('User expenses cleared', {
        userId,
        deletedCount
      });

      businessLogger('expenses_cleared', 'expense', {
        userId,
        deletedCount
      });

      res.json({
        message: 'All expenses cleared successfully',
        deletedCount
      });
    } catch (error) {
      this.logger.error('Failed to clear expenses', {
        error: error.message,
        userId: req.user?.uid
      });

      res.status(500).json({
        error: 'Failed to clear expenses',
        message: 'An internal error occurred while clearing expenses'
      });
    }
  }

  /**
   * Get expense statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getExpenseStatistics(req, res) {
    try {
      const userId = req.user?.uid || 'anonymous';
      const filters = req.query;

      const stats = await this.expenseModel.getExpenseStatistics(userId, filters);

      this.logger.info('Expense statistics retrieved', {
        userId,
        filters
      });

      res.json(stats);
    } catch (error) {
      this.logger.error('Failed to get expense statistics', {
        error: error.message,
        userId: req.user?.uid,
        filters: req.query
      });

      res.status(500).json({
        error: 'Failed to retrieve statistics',
        message: 'An internal error occurred while fetching statistics'
      });
    }
  }

  /**
   * Parse expense from natural language
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async parseExpense(req, res) {
    try {
      const { message, context } = req.body;
      const userId = req.user?.uid || 'anonymous';

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid message',
          message: 'Message is required and must be a non-empty string'
        });
      }

      const parsedExpense = await this.aiService.parseExpense(message, {
        ...context,
        userId
      });

      this.logger.info('Expense parsed successfully', {
        userId,
        messageLength: message.length,
        parsedAmount: parsedExpense.amount,
        parsedCategory: parsedExpense.category
      });

      businessLogger('expense_parsed', 'ai', {
        userId,
        messageLength: message.length,
        parsedAmount: parsedExpense.amount,
        parsedCategory: parsedExpense.category
      });

      res.json(parsedExpense);
    } catch (error) {
      this.logger.error('Failed to parse expense', {
        error: error.message,
        userId: req.user?.uid,
        message: req.body.message
      });

      res.status(400).json({
        error: 'Failed to parse expense',
        message: error.message
      });
    }
  }

  /**
   * Process query with AI
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processQuery(req, res) {
    try {
      const { query, context } = req.body;
      const userId = req.user?.uid || 'anonymous';

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid query',
          message: 'Query is required and must be a non-empty string'
        });
      }

      // Get user's expense data for context
      const expenseData = await this.expenseModel.getExpenses({}, userId, { limit: 100 });

      const response = await this.aiService.processQuery(query, expenseData, {
        ...context,
        userId
      });

      this.logger.info('Query processed successfully', {
        userId,
        queryLength: query.length,
        responseLength: response.length
      });

      businessLogger('query_processed', 'ai', {
        userId,
        queryLength: query.length
      });

      res.json({ response });
    } catch (error) {
      this.logger.error('Failed to process query', {
        error: error.message,
        userId: req.user?.uid,
        query: req.body.query
      });

      res.status(500).json({
        error: 'Failed to process query',
        message: 'An internal error occurred while processing your query'
      });
    }
  }
}

module.exports = ExpenseController;

/**
 * Expense Model
 * Production-ready data model with validation and business logic
 */

const Joi = require('joi');
const { logger, businessLogger } = require('../config/logger');

// Expense validation schema
const expenseSchema = Joi.object({
  id: Joi.number().integer().positive(),
  amount: Joi.number().positive().precision(2).required(),
  description: Joi.string().min(1).max(500).required(),
  category: Joi.string().min(1).max(100).required(),
  date: Joi.date().iso().max('now').required(),
  userId: Joi.string().min(1).max(100),
  createdAt: Joi.date().iso(),
  updatedAt: Joi.date().iso()
});

// Category validation schema
const categorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  icon: Joi.string().min(1).max(50)
});

// Expense creation schema (without auto-generated fields)
const createExpenseSchema = expenseSchema.fork(['id', 'createdAt', 'updatedAt'], (schema) => schema.forbidden());

// Expense update schema (partial updates allowed)
const updateExpenseSchema = expenseSchema.fork(['id', 'userId', 'createdAt'], (schema) => schema.optional());

class ExpenseModel {
  constructor(database) {
    this.db = database;
    this.logger = logger.child({ component: 'ExpenseModel' });
  }

  /**
   * Validate expense data
   * @param {Object} expenseData - Expense data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validated expense data
   * @throws {Error} Validation error
   */
  validateExpense(expenseData, isUpdate = false) {
    const schema = isUpdate ? updateExpenseSchema : createExpenseSchema;
    const { error, value } = schema.validate(expenseData, { abortEarly: false });
    
    if (error) {
      this.logger.error('Expense validation failed', {
        error: error.details,
        expenseData,
        isUpdate
      });
      throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    return value;
  }

  /**
   * Create a new expense
   * @param {Object} expenseData - Expense data
   * @param {string} userId - User ID
   * @returns {Object} Created expense
   */
  async createExpense(expenseData, userId = null) {
    try {
      const validatedData = this.validateExpense(expenseData);
      
      const expense = {
        ...validatedData,
        userId: userId || 'anonymous',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await this.db.addExpense(expense);
      
      businessLogger('expense_created', 'expense', {
        expenseId: result.id,
        amount: result.amount,
        category: result.category,
        userId: result.userId
      });

      this.logger.info('Expense created successfully', {
        expenseId: result.id,
        userId: result.userId
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to create expense', {
        error: error.message,
        expenseData,
        userId
      });
      throw error;
    }
  }

  /**
   * Get expense by ID
   * @param {number} id - Expense ID
   * @param {string} userId - User ID for authorization
   * @returns {Object|null} Expense or null if not found
   */
  async getExpenseById(id, userId = null) {
    try {
      const expense = await this.db.getExpenseById(id);
      
      if (!expense) {
        return null;
      }

      // Check user authorization
      if (userId && expense.userId !== userId) {
        this.logger.warn('Unauthorized expense access attempt', {
          expenseId: id,
          requestedBy: userId,
          actualOwner: expense.userId
        });
        throw new Error('Unauthorized access to expense');
      }

      return expense;
    } catch (error) {
      this.logger.error('Failed to get expense by ID', {
        error: error.message,
        expenseId: id,
        userId
      });
      throw error;
    }
  }

  /**
   * Get expenses with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {string} userId - User ID
   * @param {Object} pagination - Pagination options
   * @returns {Object} Filtered expenses with metadata
   */
  async getExpenses(filters = {}, userId = null, pagination = {}) {
    try {
      const {
        category,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search
      } = filters;

      const {
        page = 1,
        limit = 50,
        sortBy = 'date',
        sortOrder = 'DESC'
      } = pagination;

      // Build query filters
      const queryFilters = {
        userId: userId || 'anonymous',
        ...(category && { category }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(minAmount && { minAmount }),
        ...(maxAmount && { maxAmount }),
        ...(search && { search })
      };

      const expenses = await this.db.getExpenses(queryFilters, {
        page,
        limit,
        sortBy,
        sortOrder
      });

      const totalCount = await this.db.getExpenseCount(queryFilters);
      const totalPages = Math.ceil(totalCount / limit);

      this.logger.info('Expenses retrieved', {
        count: expenses.length,
        totalCount,
        page,
        totalPages,
        userId
      });

      return {
        expenses,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      this.logger.error('Failed to get expenses', {
        error: error.message,
        filters,
        userId,
        pagination
      });
      throw error;
    }
  }

  /**
   * Update expense
   * @param {number} id - Expense ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID for authorization
   * @returns {Object} Updated expense
   */
  async updateExpense(id, updateData, userId = null) {
    try {
      const validatedData = this.validateExpense(updateData, true);
      
      // Check if expense exists and user has permission
      const existingExpense = await this.getExpenseById(id, userId);
      if (!existingExpense) {
        throw new Error('Expense not found');
      }

      const updatedExpense = {
        ...validatedData,
        id,
        updatedAt: new Date().toISOString()
      };

      const result = await this.db.updateExpense(id, updatedExpense);
      
      businessLogger('expense_updated', 'expense', {
        expenseId: id,
        changes: validatedData,
        userId
      });

      this.logger.info('Expense updated successfully', {
        expenseId: id,
        userId
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to update expense', {
        error: error.message,
        expenseId: id,
        updateData,
        userId
      });
      throw error;
    }
  }

  /**
   * Delete expense
   * @param {number} id - Expense ID
   * @param {string} userId - User ID for authorization
   * @returns {boolean} Success status
   */
  async deleteExpense(id, userId = null) {
    try {
      // Check if expense exists and user has permission
      const existingExpense = await this.getExpenseById(id, userId);
      if (!existingExpense) {
        throw new Error('Expense not found');
      }

      const result = await this.db.deleteExpense(id);
      
      businessLogger('expense_deleted', 'expense', {
        expenseId: id,
        userId
      });

      this.logger.info('Expense deleted successfully', {
        expenseId: id,
        userId
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to delete expense', {
        error: error.message,
        expenseId: id,
        userId
      });
      throw error;
    }
  }

  /**
   * Get expense statistics
   * @param {string} userId - User ID
   * @param {Object} filters - Filter criteria
   * @returns {Object} Expense statistics
   */
  async getExpenseStatistics(userId = null, filters = {}) {
    try {
      const queryFilters = {
        userId: userId || 'anonymous',
        ...filters
      };

      const stats = await this.db.getExpenseStatistics(queryFilters);
      
      this.logger.info('Expense statistics retrieved', {
        userId,
        filters,
        stats
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get expense statistics', {
        error: error.message,
        userId,
        filters
      });
      throw error;
    }
  }

  /**
   * Clear all expenses for a user
   * @param {string} userId - User ID
   * @returns {number} Number of deleted expenses
   */
  async clearUserExpenses(userId = null) {
    try {
      const result = await this.db.clearUserExpenses(userId || 'anonymous');
      
      businessLogger('expenses_cleared', 'expense', {
        userId,
        deletedCount: result
      });

      this.logger.info('User expenses cleared', {
        userId,
        deletedCount: result
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to clear user expenses', {
        error: error.message,
        userId
      });
      throw error;
    }
  }
}

module.exports = ExpenseModel;

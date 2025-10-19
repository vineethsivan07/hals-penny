/**
 * Expense Routes
 * Production-ready route definitions with proper middleware
 */

const express = require('express');
const ExpenseController = require('../controllers/expense-controller');
const { 
  apiRateLimit, 
  authRateLimit, 
  sanitizeInput, 
  preventSQLInjection,
  requestSizeLimit 
} = require('../middleware/security');
const { requestLogger, errorLogger } = require('../config/logger');
const config = require('../config/environment');

/**
 * Create expense routes
 * @param {Object} database - Database instance
 * @returns {Object} Express router
 */
function createExpenseRoutes(database) {
  const router = express.Router();
  const expenseController = new ExpenseController(database);

  // Apply security middleware to all routes
  router.use(requestLogger);
  router.use(sanitizeInput);
  router.use(preventSQLInjection);
  router.use(requestSizeLimit(config.UPLOAD.MAX_FILE_SIZE));

  // Apply rate limiting
  router.use(apiRateLimit);

  /**
   * @swagger
   * /api/expenses:
   *   get:
   *     summary: Get expenses with filtering and pagination
   *     tags: [Expenses]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Number of items per page
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter by category
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by end date
   *       - in: query
   *         name: minAmount
   *         schema:
   *           type: number
   *         description: Minimum amount filter
   *       - in: query
   *         name: maxAmount
   *         schema:
   *           type: number
   *         description: Maximum amount filter
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in description
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [date, amount, category, description]
   *         description: Sort field
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *         description: Sort order
   *     responses:
   *       200:
   *         description: Expenses retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 expenses:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Expense'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       400:
   *         description: Invalid request parameters
   *       500:
   *         description: Internal server error
   */
  router.get('/', expenseController.getExpenses.bind(expenseController));

  /**
   * @swagger
   * /api/expenses/{id}:
   *   get:
   *     summary: Get expense by ID
   *     tags: [Expenses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Expense ID
   *     responses:
   *       200:
   *         description: Expense retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Expense'
   *       404:
   *         description: Expense not found
   *       500:
   *         description: Internal server error
   */
  router.get('/:id', expenseController.getExpenseById.bind(expenseController));

  /**
   * @swagger
   * /api/expenses:
   *   post:
   *     summary: Create new expense
   *     tags: [Expenses]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - amount
   *               - description
   *               - category
   *               - date
   *             properties:
   *               amount:
   *                 type: number
   *                 minimum: 0.01
   *                 description: Expense amount
   *               description:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 500
   *                 description: Expense description
   *               category:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 100
   *                 description: Expense category
   *               date:
   *                 type: string
   *                 format: date
   *                 description: Expense date
   *     responses:
   *       201:
   *         description: Expense created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Expense'
   *       400:
   *         description: Invalid request data
   *       500:
   *         description: Internal server error
   */
  router.post('/', expenseController.createExpense.bind(expenseController));

  /**
   * @swagger
   * /api/expenses/{id}:
   *   put:
   *     summary: Update expense
   *     tags: [Expenses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Expense ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               amount:
   *                 type: number
   *                 minimum: 0.01
   *               description:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 500
   *               category:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 100
   *               date:
   *                 type: string
   *                 format: date
   *     responses:
   *       200:
   *         description: Expense updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Expense'
   *       400:
   *         description: Invalid request data
   *       404:
   *         description: Expense not found
   *       500:
   *         description: Internal server error
   */
  router.put('/:id', expenseController.updateExpense.bind(expenseController));

  /**
   * @swagger
   * /api/expenses/{id}:
   *   delete:
   *     summary: Delete expense
   *     tags: [Expenses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Expense ID
   *     responses:
   *       204:
   *         description: Expense deleted successfully
   *       404:
   *         description: Expense not found
   *       500:
   *         description: Internal server error
   */
  router.delete('/:id', expenseController.deleteExpense.bind(expenseController));

  /**
   * @swagger
   * /api/expenses/clear:
   *   delete:
   *     summary: Clear all expenses for user
   *     tags: [Expenses]
   *     responses:
   *       200:
   *         description: All expenses cleared successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 deletedCount:
   *                   type: integer
   *       500:
   *         description: Internal server error
   */
  router.delete('/clear', expenseController.clearExpenses.bind(expenseController));

  /**
   * @swagger
   * /api/expenses/stats:
   *   get:
   *     summary: Get expense statistics
   *     tags: [Expenses]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for statistics
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for statistics
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ExpenseStatistics'
   *       500:
   *         description: Internal server error
   */
  router.get('/stats', expenseController.getExpenseStatistics.bind(expenseController));

  /**
   * @swagger
   * /api/expenses/parse:
   *   post:
   *     summary: Parse expense from natural language
   *     tags: [Expenses]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *                 minLength: 1
   *                 description: Natural language message
   *               context:
   *                 type: object
   *                 description: Additional context
   *     responses:
   *       200:
   *         description: Expense parsed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 amount:
   *                   type: number
   *                 description:
   *                   type: string
   *                 category:
   *                   type: string
   *                 date:
   *                   type: string
   *                   format: date
   *       400:
   *         description: Invalid request or parsing failed
   *       500:
   *         description: Internal server error
   */
  router.post('/parse', expenseController.parseExpense.bind(expenseController));

  /**
   * @swagger
   * /api/expenses/query:
   *   post:
   *     summary: Process query with AI
   *     tags: [Expenses]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - query
   *             properties:
   *               query:
   *                 type: string
   *                 minLength: 1
   *                 description: User query
   *               context:
   *                 type: object
   *                 description: Additional context
   *     responses:
   *       200:
   *         description: Query processed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 response:
   *                   type: string
   *       400:
   *         description: Invalid request
   *       500:
   *         description: Internal server error
   */
  router.post('/query', expenseController.processQuery.bind(expenseController));

  // Error handling middleware
  router.use(errorLogger);

  return router;
}

module.exports = createExpenseRoutes;

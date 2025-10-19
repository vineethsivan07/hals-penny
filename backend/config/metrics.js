/**
 * Prometheus Metrics Configuration
 * Comprehensive metrics collection for HAL's Penny
 */

const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'hals-penny',
  version: '1.0.0'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// ============================================================================
// BUSINESS METRICS
// ============================================================================

// Total expenses created
const totalExpenses = new client.Counter({
  name: 'hals_penny_expenses_total',
  help: 'Total number of expenses created',
  labelNames: ['category', 'user_id'],
  registers: [register]
});

// Total expense amount
const totalExpenseAmount = new client.Counter({
  name: 'hals_penny_expense_amount_total',
  help: 'Total amount of all expenses',
  labelNames: ['category', 'user_id'],
  registers: [register]
});

// Average expense amount
const averageExpenseAmount = new client.Gauge({
  name: 'hals_penny_expense_amount_average',
  help: 'Average expense amount',
  labelNames: ['category', 'user_id'],
  registers: [register]
});

// Expenses by category
const expensesByCategory = new client.Counter({
  name: 'hals_penny_expenses_by_category_total',
  help: 'Number of expenses by category',
  labelNames: ['category'],
  registers: [register]
});

// ============================================================================
// AI SERVICE METRICS
// ============================================================================

// AI service calls
const aiServiceCalls = new client.Counter({
  name: 'hals_penny_ai_service_calls_total',
  help: 'Total number of AI service calls',
  labelNames: ['service', 'operation', 'status'],
  registers: [register]
});

// AI service response time
const aiServiceResponseTime = new client.Histogram({
  name: 'hals_penny_ai_service_response_time_seconds',
  help: 'AI service response time in seconds',
  labelNames: ['service', 'operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

// AI service errors
const aiServiceErrors = new client.Counter({
  name: 'hals_penny_ai_service_errors_total',
  help: 'Total number of AI service errors',
  labelNames: ['service', 'operation', 'error_type'],
  registers: [register]
});

// AI fallback usage
const aiFallbackUsage = new client.Counter({
  name: 'hals_penny_ai_fallback_usage_total',
  help: 'Number of times AI fallback was used',
  labelNames: ['fallback_level', 'original_service'],
  registers: [register]
});

// ============================================================================
// USER INTERACTION METRICS
// ============================================================================

// User connections
const userConnections = new client.Counter({
  name: 'hals_penny_user_connections_total',
  help: 'Total number of user connections',
  registers: [register]
});

// User disconnections
const userDisconnections = new client.Counter({
  name: 'hals_penny_user_disconnections_total',
  help: 'Total number of user disconnections',
  registers: [register]
});

// Active users
const activeUsers = new client.Gauge({
  name: 'hals_penny_active_users',
  help: 'Number of currently active users',
  registers: [register]
});

// Chat messages
const chatMessages = new client.Counter({
  name: 'hals_penny_chat_messages_total',
  help: 'Total number of chat messages',
  labelNames: ['message_type', 'user_id'],
  registers: [register]
});

// ============================================================================
// API METRICS
// ============================================================================

// API requests
const apiRequests = new client.Counter({
  name: 'hals_penny_api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'endpoint', 'status_code'],
  registers: [register]
});

// API response time
const apiResponseTime = new client.Histogram({
  name: 'hals_penny_api_response_time_seconds',
  help: 'API response time in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

// ============================================================================
// DATABASE METRICS
// ============================================================================

// Database operations
const databaseOperations = new client.Counter({
  name: 'hals_penny_database_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'table', 'status'],
  registers: [register]
});

// Database response time
const databaseResponseTime = new client.Histogram({
  name: 'hals_penny_database_response_time_seconds',
  help: 'Database operation response time in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register]
});

// ============================================================================
// SYSTEM METRICS
// ============================================================================

// Memory usage
const memoryUsage = new client.Gauge({
  name: 'hals_penny_memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
  registers: [register]
});

// CPU usage
const cpuUsage = new client.Gauge({
  name: 'hals_penny_cpu_usage_percent',
  help: 'CPU usage percentage',
  registers: [register]
});

// ============================================================================
// BUSINESS INTELLIGENCE METRICS
// ============================================================================

// Daily spending
const dailySpending = new client.Gauge({
  name: 'hals_penny_daily_spending_amount',
  help: 'Daily spending amount',
  labelNames: ['date', 'user_id'],
  registers: [register]
});

// Monthly spending
const monthlySpending = new client.Gauge({
  name: 'hals_penny_monthly_spending_amount',
  help: 'Monthly spending amount',
  labelNames: ['month', 'user_id'],
  registers: [register]
});

// Budget utilization
const budgetUtilization = new client.Gauge({
  name: 'hals_penny_budget_utilization_percent',
  help: 'Budget utilization percentage',
  labelNames: ['budget_type', 'user_id'],
  registers: [register]
});

// ============================================================================
// EXPORT METRICS
// ============================================================================

module.exports = {
  register,
  // Business metrics
  totalExpenses,
  totalExpenseAmount,
  averageExpenseAmount,
  expensesByCategory,
  
  // AI service metrics
  aiServiceCalls,
  aiServiceResponseTime,
  aiServiceErrors,
  aiFallbackUsage,
  
  // User interaction metrics
  userConnections,
  userDisconnections,
  activeUsers,
  chatMessages,
  
  // API metrics
  apiRequests,
  apiResponseTime,
  
  // Database metrics
  databaseOperations,
  databaseResponseTime,
  
  // System metrics
  memoryUsage,
  cpuUsage,
  
  // Business intelligence metrics
  dailySpending,
  monthlySpending,
  budgetUtilization
};

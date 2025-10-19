import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const expenseAPI = {
  // Get all expenses
  getExpenses: () => api.get('/expenses'),
  
  // Get expense by ID
  getExpense: (id) => api.get(`/expenses/${id}`),
  
  // Create new expense
  createExpense: (expense) => api.post('/expenses', expense),
  
  // Update expense
  updateExpense: (id, expense) => api.put(`/expenses/${id}`, expense),
  
  // Delete expense
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  
  // Get summary statistics
  getSummary: () => api.get('/expenses/stats/summary'),
  
  // Get expenses by category
  getByCategory: () => api.get('/expenses/stats/by-category'),
  
  // Get monthly expenses
  getMonthly: () => api.get('/expenses/stats/monthly'),
};

export default api;

import React, { useState, useEffect } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import ExpenseSummary from './components/ExpenseSummary';
import ExpenseChart from './components/ExpenseChart';
import DailyAnalytics from './components/DailyAnalytics';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCharts, setShowCharts] = useState(false);

  // Load expenses from API on component mount
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/expenses');
      const data = await response.json();
      setExpenses(data);
      setError(null);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError('Failed to load expenses. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const addExpense = (expense) => {
    setExpenses([expense, ...expenses]);
  };

  const updateExpenses = (newExpenses) => {
    setExpenses(newExpenses);
  };

  if (loading) {
    return (
      <div className="App">
        <header className="app-header">
          <h1>🤖 HAL's Penny</h1>
          <p>Loading your expenses...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>🤖 HAL's Penny</h1>
        <p>Chat with AI to track expenses and get insights</p>
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}
        <div className="header-controls">
          <button 
            className="toggle-charts-btn"
            onClick={() => setShowCharts(!showCharts)}
          >
            {showCharts ? '💬 Hide Charts' : '📊 Show Charts'}
          </button>
        </div>
      </header>
      
      <main className="app-main">
        <div className="dashboard">
          <div className="dashboard-left">
            <ChatInterface 
              onExpenseAdded={addExpense}
              onExpensesUpdated={updateExpenses}
            />
          </div>
          
          {showCharts && (
            <div className="dashboard-right fade-in">
              <ExpenseSummary key={`summary-${expenses.length}`} expenses={expenses} />
              <ExpenseChart key={`chart-${expenses.length}`} expenses={expenses} />
              <DailyAnalytics key={`daily-${expenses.length}`} expenses={expenses} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
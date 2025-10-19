import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import UserProfile from './components/UserProfile';
import ProfilePage from './components/ProfilePage';
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
  const [showDailyAnalytics, setShowDailyAnalytics] = useState(false);

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

  const handleShowChart = () => {
    setShowCharts(!showCharts);
    setShowDailyAnalytics(false);
  };

  const handleShowDailyAnalytics = () => {
    setShowDailyAnalytics(!showDailyAnalytics);
    setShowCharts(false);
  };

  const handleClearAllExpenses = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/expenses/clear', {
        method: 'DELETE'
      });
      if (response.ok) {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error clearing expenses:', error);
    }
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
    <Router>
      <AuthProvider>
        <div className="App">
          <AuthGuard>
            <Routes>
              <Route path="/" element={
                <>
                  <main className="app-main">
                    <div className={`dashboard ${(showCharts || showDailyAnalytics) ? 'charts-visible' : ''}`}>
                      <div className="dashboard-left">
                        <ChatInterface 
                          onExpenseAdded={addExpense}
                          onExpensesUpdated={updateExpenses}
                          onShowChart={handleShowChart}
                          onShowDailyAnalytics={handleShowDailyAnalytics}
                          onClearAllExpenses={handleClearAllExpenses}
                          userProfile={<UserProfile />}
                          error={error}
                        />
                      </div>
                      
                      {showCharts && (
                        <div className="dashboard-right fade-in">
                          <ExpenseSummary key={`summary-${expenses.length}`} expenses={expenses} />
                          <ExpenseChart key={`chart-${expenses.length}`} expenses={expenses} />
                        </div>
                      )}
                      
                      {showDailyAnalytics && (
                        <div className="dashboard-right fade-in">
                          <DailyAnalytics key={`daily-${expenses.length}`} expenses={expenses} />
                        </div>
                      )}
                    </div>
                  </main>
                </>
              } />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </AuthGuard>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
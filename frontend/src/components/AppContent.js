import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';
import ProfilePage from './ProfilePage';
import SubscriptionPage from './SubscriptionPage';
import ChatInterface from './ChatInterface';
import ExpenseSummary from './ExpenseSummary';
import ExpenseChart from './ExpenseChart';
import DailyAnalytics from './DailyAnalytics';

function AppContent() {
  const { currentUser, hasSelectedPlan, saveSubscriptionPlan } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCharts, setShowCharts] = useState(false);
  const [showDailyAnalytics, setShowDailyAnalytics] = useState(false);

  // Load expenses from API on component mount
  useEffect(() => {
    if (currentUser && hasSelectedPlan) {
      loadExpenses();
    }
  }, [currentUser, hasSelectedPlan]);

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

  const handleSubscriptionSelected = async (plan) => {
    console.log('handleSubscriptionSelected called with plan:', plan);
    const success = await saveSubscriptionPlan(plan);
    if (success) {
      console.log(`User selected ${plan} plan successfully`);
      console.log('hasSelectedPlan should now be true');
    } else {
      console.error('Failed to save subscription plan');
    }
  };

  // Debug logging
  console.log('AppContent render - currentUser:', !!currentUser, 'hasSelectedPlan:', hasSelectedPlan);

  // Show subscription page if user hasn't selected a plan
  if (currentUser && !hasSelectedPlan) {
    console.log('Showing subscription page');
    return <SubscriptionPage onSubscriptionSelected={handleSubscriptionSelected} />;
  }

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
    </div>
  );
}

export default AppContent;

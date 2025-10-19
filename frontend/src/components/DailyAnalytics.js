import React, { useState, useEffect } from 'react';
import './DailyAnalytics.css';

const DailyAnalytics = ({ expenses }) => {
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyBudget, setDailyBudget] = useState(() => {
    return parseFloat(localStorage.getItem('dailyBudget')) || 50;
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(dailyBudget);

  useEffect(() => {
    fetchDailyAnalytics();
  }, [expenses]);

  const fetchDailyAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/expenses/stats/daily');
      if (!response.ok) {
        throw new Error('Failed to fetch daily analytics');
      }
      const data = await response.json();
      setDailyData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching daily analytics:', err);
      setError('Failed to load daily analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleBudgetChange = () => {
    const newBudget = parseFloat(tempBudget);
    if (!isNaN(newBudget) && newBudget > 0) {
      setDailyBudget(newBudget);
      localStorage.setItem('dailyBudget', newBudget.toString());
      setIsEditingBudget(false);
    }
  };

  const getBudgetStatus = (amount) => {
    if (amount <= dailyBudget * 0.5) return 'under-budget';
    if (amount <= dailyBudget * 0.8) return 'near-budget';
    if (amount <= dailyBudget) return 'at-budget';
    return 'over-budget';
  };

  const getBudgetStatusText = (amount) => {
    const status = getBudgetStatus(amount);
    const remaining = dailyBudget - amount;
    switch (status) {
      case 'under-budget':
        return `Under budget by ${formatAmount(remaining)}`;
      case 'near-budget':
        return `Near budget (${formatAmount(remaining)} left)`;
      case 'at-budget':
        return 'At budget limit';
      case 'over-budget':
        return `Over budget by ${formatAmount(-remaining)}`;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="daily-analytics">
        <h2 className="analytics-title">📅 Daily Analytics</h2>
        <div className="loading-message">Loading daily analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="daily-analytics">
        <h2 className="analytics-title">📅 Daily Analytics</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (dailyData.length === 0) {
    return (
      <div className="daily-analytics">
        <h2 className="analytics-title">📅 Daily Analytics</h2>
        <div className="no-data-message">No expenses found for daily analysis</div>
      </div>
    );
  }

  return (
    <div className="daily-analytics">
      <div className="analytics-header">
        <h2 className="analytics-title">📅 Daily Budget Analytics</h2>
        <div className="budget-controls">
          {isEditingBudget ? (
            <div className="budget-edit">
              <input
                type="number"
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                className="budget-input"
                placeholder="Daily budget"
                min="1"
                step="0.01"
              />
              <button onClick={handleBudgetChange} className="budget-save">Save</button>
              <button onClick={() => setIsEditingBudget(false)} className="budget-cancel">Cancel</button>
            </div>
          ) : (
            <div className="budget-display">
              <span className="budget-label">Daily Budget:</span>
              <span className="budget-value">{formatAmount(dailyBudget)}</span>
              <button onClick={() => setIsEditingBudget(true)} className="budget-edit-btn">Edit</button>
            </div>
          )}
        </div>
      </div>

      <div className="analytics-summary">
        <div className="summary-item">
          <span className="summary-label">Days Tracked:</span>
          <span className="summary-value">{dailyData.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Spent:</span>
          <span className="summary-value">
            {formatAmount(dailyData.reduce((sum, day) => sum + day.total_amount, 0))}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg/Day:</span>
          <span className="summary-value">
            {formatAmount(dailyData.reduce((sum, day) => sum + day.total_amount, 0) / dailyData.length)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Budget Days:</span>
          <span className="summary-value">
            {dailyData.filter(day => day.total_amount <= dailyBudget).length} / {dailyData.length}
          </span>
        </div>
      </div>
      
      <div className="budget-table-container">
        <table className="budget-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Spent</th>
              <th>Budget Status</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {dailyData.map((day, index) => (
              <tr key={index} className={`budget-row ${getBudgetStatus(day.total_amount)}`}>
                <td className="date-cell">
                  <div className="date-info">
                    <div className="date-main">{formatDate(day.date)}</div>
                    <div className="date-sub">{day.transaction_count} transactions</div>
                  </div>
                </td>
                <td className="amount-cell">
                  <span className="amount-value">{formatAmount(day.total_amount)}</span>
                </td>
                <td className="status-cell">
                  <span className={`status-text ${getBudgetStatus(day.total_amount)}`}>
                    {getBudgetStatusText(day.total_amount)}
                  </span>
                </td>
                <td className="progress-cell">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${getBudgetStatus(day.total_amount)}`}
                      style={{ 
                        width: `${Math.min((day.total_amount / dailyBudget) * 100, 100)}%` 
                      }}
                    ></div>
                    <span className="progress-text">
                      {Math.round((day.total_amount / dailyBudget) * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyAnalytics;

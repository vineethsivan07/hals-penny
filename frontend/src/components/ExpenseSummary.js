import React from 'react';
import './ExpenseSummary.css';

const ExpenseSummary = ({ expenses }) => {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const categories = {
    food: { name: 'Food & Dining', icon: '🍔', color: '#FF6384' },
    transport: { name: 'Transportation', icon: '🚗', color: '#36A2EB' },
    shopping: { name: 'Shopping', icon: '🛍️', color: '#FFCE56' },
    entertainment: { name: 'Entertainment', icon: '🎬', color: '#4BC0C0' },
    bills: { name: 'Bills & Utilities', icon: '💡', color: '#9966FF' },
    healthcare: { name: 'Healthcare', icon: '🏥', color: '#FF9F40' },
    education: { name: 'Education', icon: '📚', color: '#FF6384' },
    other: { name: 'Other', icon: '📦', color: '#C9CBCF' }
  };

  const sortedCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
  });

  const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

  if (expenses.length === 0) {
    return (
      <div className="expense-summary">
        <h2 className="summary-title">💰 Expense Summary</h2>
        <div className="no-expenses">
          <div className="no-expenses-icon">📊</div>
          <h3>No Expenses Yet</h3>
          <p>Start tracking your expenses by chatting with the AI assistant!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expense-summary">
      <h2 className="summary-title">💰 Expense Summary</h2>
      
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-value">${totalExpenses.toFixed(2)}</div>
          <div className="stat-label">Total Expenses</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">${thisMonthTotal.toFixed(2)}</div>
          <div className="stat-label">This Month</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">${averageExpense.toFixed(2)}</div>
          <div className="stat-label">Average</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{expenses.length}</div>
          <div className="stat-label">Transactions</div>
        </div>
      </div>

      {sortedCategories.length > 0 && (
        <div className="category-breakdown">
          <h3 className="breakdown-title">Top Categories</h3>
          <div className="category-list">
            {sortedCategories.slice(0, 5).map(({ category, amount, percentage }) => (
              <div key={category} className={`category-item category-${category}`}>
                <div className="category-name">
                  <span className="category-icon">
                    {categories[category]?.icon || '📦'}
                  </span>
                  {categories[category]?.name || category}
                </div>
                <div className="category-amount">
                  ${amount.toFixed(2)}
                  <span className="category-percentage">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseSummary;

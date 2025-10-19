import React, { useState } from 'react';
import './ExpenseList.css';

const ExpenseList = ({ expenses, onDeleteExpense, onEditExpense }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const categories = {
    food: '🍔 Food & Dining',
    transport: '🚗 Transportation',
    shopping: '🛍️ Shopping',
    entertainment: '🎬 Entertainment',
    bills: '💡 Bills & Utilities',
    healthcare: '🏥 Healthcare',
    education: '📚 Education',
    other: '📦 Other'
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setEditForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date.split('T')[0]
    });
  };

  const handleSaveEdit = (id) => {
    onEditExpense(id, {
      ...editForm,
      amount: parseFloat(editForm.amount)
    });
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="expense-list">
      <h2>Recent Expenses</h2>
      {expenses.length === 0 ? (
        <div className="empty-state">
          <p>No expenses yet. Add your first expense above!</p>
        </div>
      ) : (
        <div className="expenses-container">
          {sortedExpenses.map(expense => (
            <div key={expense.id} className="expense-item">
              {editingId === expense.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="edit-input"
                  />
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                    className="edit-input"
                    step="0.01"
                  />
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="edit-select"
                  >
                    <option value="food">🍔 Food & Dining</option>
                    <option value="transport">🚗 Transportation</option>
                    <option value="shopping">🛍️ Shopping</option>
                    <option value="entertainment">🎬 Entertainment</option>
                    <option value="bills">💡 Bills & Utilities</option>
                    <option value="healthcare">🏥 Healthcare</option>
                    <option value="education">📚 Education</option>
                    <option value="other">📦 Other</option>
                  </select>
                  <div className="edit-actions">
                    <button onClick={() => handleSaveEdit(expense.id)} className="save-btn">
                      Save
                    </button>
                    <button onClick={handleCancelEdit} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="expense-info">
                    <div className="expense-main">
                      <h3>{expense.description}</h3>
                      <span className="expense-category">
                        {categories[expense.category]}
                      </span>
                    </div>
                    <div className="expense-details">
                      <span className="expense-amount">${expense.amount.toFixed(2)}</span>
                      <span className="expense-date">{formatDate(expense.date)}</span>
                    </div>
                  </div>
                  <div className="expense-actions">
                    <button 
                      onClick={() => handleEdit(expense)}
                      className="edit-btn"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => onDeleteExpense(expense.id)}
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;

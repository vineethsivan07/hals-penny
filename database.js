const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'expenses.db'));
    this.init();
  }

  init() {
    // Create expenses table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        emoji TEXT,
        color TEXT
      )
    `, () => {
      // Insert default categories
      this.insertDefaultCategories();
    });
  }

  insertDefaultCategories() {
    const categories = [
      { name: 'food', emoji: '🍔', color: '#FF6384' },
      { name: 'transport', emoji: '🚗', color: '#36A2EB' },
      { name: 'shopping', emoji: '🛍️', color: '#FFCE56' },
      { name: 'entertainment', emoji: '🎬', color: '#4BC0C0' },
      { name: 'bills', emoji: '💡', color: '#9966FF' },
      { name: 'healthcare', emoji: '🏥', color: '#FF9F40' },
      { name: 'education', emoji: '📚', color: '#FF6384' },
      { name: 'other', emoji: '📦', color: '#C9CBCF' }
    ];

    categories.forEach(category => {
      this.db.run(
        'INSERT OR IGNORE INTO categories (name, emoji, color) VALUES (?, ?, ?)',
        [category.name, category.emoji, category.color]
      );
    });
  }

  // Expense operations
  async addExpense(expense) {
    return new Promise((resolve, reject) => {
      const { description, amount, category, date } = expense;
      this.db.run(
        'INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)',
        [description, amount, category, date],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...expense });
        }
      );
    });
  }

  async getExpenses() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM expenses ORDER BY date DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getExpenseById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM expenses WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async updateExpense(id, expense) {
    return new Promise((resolve, reject) => {
      const { description, amount, category, date } = expense;
      this.db.run(
        'UPDATE expenses SET description = ?, amount = ?, category = ?, date = ? WHERE id = ?',
        [description, amount, category, date, id],
        function(err) {
          if (err) reject(err);
          else resolve({ id, ...expense });
        }
      );
    });
  }

  async deleteExpense(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM expenses WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  // Analytics queries
  async getExpensesByCategory() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM expenses 
        GROUP BY category 
        ORDER BY total DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getExpensesByMonth(months = 6) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          strftime('%Y-%m', date) as month,
          SUM(amount) as total,
          COUNT(*) as count
        FROM expenses 
        WHERE date >= date('now', '-${months} months')
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getExpensesByCategoryAndMonth(category, months = 1) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          strftime('%Y-%m', date) as month,
          SUM(amount) as total,
          COUNT(*) as count
        FROM expenses 
        WHERE category = ? AND date >= date('now', '-${months} months')
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month
      `, [category], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getTotalExpenses() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT SUM(amount) as total, COUNT(*) as count FROM expenses', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getExpensesInDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
        [startDate, endDate],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Get expenses by day for analytics
  getExpensesByDay() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT 
          date,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          GROUP_CONCAT(description, ' | ') as descriptions,
          GROUP_CONCAT(category, ' | ') as categories
        FROM expenses 
        GROUP BY date 
        ORDER BY date DESC`,
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // Clear all expenses from database
  clearAllExpenses() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM expenses', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ message: 'All expenses cleared successfully' });
        }
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;

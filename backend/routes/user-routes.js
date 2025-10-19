const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'expenses.db');

// Create users table if it doesn't exist
const initUsersTable = () => {
  const db = new sqlite3.Database(dbPath);
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      display_name TEXT,
      subscription_plan TEXT DEFAULT 'free',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table ready');
    }
  });
  db.close();
};

// Initialize table on startup
initUsersTable();

// Save or update user preferences
router.post('/preferences', (req, res) => {
  const { userId, subscriptionPlan, email, displayName } = req.body;

  if (!userId || !subscriptionPlan) {
    return res.status(400).json({ error: 'User ID and subscription plan are required' });
  }

  const db = new sqlite3.Database(dbPath);
  
  // Check if user exists
  db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, row) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (row) {
      // Update existing user
      db.run(
        'UPDATE users SET subscription_plan = ?, email = ?, display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [subscriptionPlan, email, displayName, userId],
        function(err) {
          if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ error: 'Failed to update user preferences' });
          }
          res.json({ 
            success: true, 
            message: 'User preferences updated',
            subscriptionPlan: subscriptionPlan
          });
        }
      );
    } else {
      // Create new user
      db.run(
        'INSERT INTO users (user_id, email, display_name, subscription_plan) VALUES (?, ?, ?, ?)',
        [userId, email, displayName, subscriptionPlan],
        function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Failed to create user preferences' });
          }
          res.json({ 
            success: true, 
            message: 'User preferences created',
            subscriptionPlan: subscriptionPlan
          });
        }
      );
    }
  });
});

// Get user preferences
router.get('/preferences/:userId', (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const db = new sqlite3.Database(dbPath);
  
  db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, row) => {
    if (err) {
      console.error('Error fetching user preferences:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (row) {
      res.json({
        userId: row.user_id,
        email: row.email,
        displayName: row.display_name,
        subscriptionPlan: row.subscription_plan,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Update user subscription plan
router.put('/preferences/:userId', (req, res) => {
  const { userId } = req.params;
  const { subscriptionPlan } = req.body;

  if (!userId || !subscriptionPlan) {
    return res.status(400).json({ error: 'User ID and subscription plan are required' });
  }

  const db = new sqlite3.Database(dbPath);
  
  db.run(
    'UPDATE users SET subscription_plan = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
    [subscriptionPlan, userId],
    function(err) {
      if (err) {
        console.error('Error updating subscription plan:', err);
        return res.status(500).json({ error: 'Failed to update subscription plan' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        success: true, 
        message: 'Subscription plan updated',
        subscriptionPlan: subscriptionPlan
      });
    }
  );
});

module.exports = router;

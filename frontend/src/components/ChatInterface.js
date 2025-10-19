import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatInterface.css';

const ChatInterface = ({ onExpenseAdded, onExpensesUpdated }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingExpense, setPendingExpense] = useState(null);
  const [welcomeShown, setWelcomeShown] = useState(() => {
    return localStorage.getItem('welcomeShown') === 'true';
  });
  const [conversationHistory, setConversationHistory] = useState([]);
  const [optimizeMode, setOptimizeMode] = useState(() => {
    return localStorage.getItem('optimizeMode') === 'true';
  });
  const [offlineMode, setOfflineMode] = useState(() => {
    return localStorage.getItem('offlineMode') === 'true';
  });
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection with retry logic
    const connectSocket = () => {
      socketRef.current = io('http://localhost:3000', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.log('Connection error:', error);
        setIsConnected(false);
      });

      socketRef.current.on('reconnect', () => {
        console.log('Reconnected to server');
        setIsConnected(true);
      });
    };

    connectSocket();

    // Set up socket event listeners after connection
    const setupSocketEvents = () => {
      if (socketRef.current) {
        // Remove existing listeners to prevent duplicates
        socketRef.current.removeAllListeners('expensesLoaded');
        socketRef.current.removeAllListeners('expenseAdded');
        socketRef.current.removeAllListeners('expenseParsed');
        socketRef.current.removeAllListeners('parseError');
        socketRef.current.removeAllListeners('queryResponse');
        socketRef.current.removeAllListeners('queryError');
        socketRef.current.removeAllListeners('expensesCleared');

        socketRef.current.on('expensesLoaded', (expenses) => {
          onExpensesUpdated(expenses);
        });

        socketRef.current.on('expenseAdded', (expense) => {
          onExpenseAdded(expense);
          addMessage(`Got it! I've saved your ${expense.description} expense of $${expense.amount} to your records.`, 'bot');
        });

        socketRef.current.on('expenseParsed', (parsedExpense) => {
          setIsTyping(false);
          setPendingExpense(parsedExpense);
          addMessage(`I found: ${parsedExpense.description} - $${parsedExpense.amount} (${parsedExpense.category})`, 'bot');
          addMessage('Should I add this to your expense records?', 'bot');
        });

        socketRef.current.on('parseError', (error) => {
          setIsTyping(false);
          addMessage('Sorry, I couldn\'t understand that. Could you try rephrasing?', 'bot');
        });

        socketRef.current.on('queryResponse', (data) => {
          setIsTyping(false);
          addMessage(data.response, 'bot');
        });

        socketRef.current.on('queryError', (error) => {
          setIsTyping(false);
          addMessage('Sorry, I couldn\'t process that query. Please try again.', 'bot');
        });

        socketRef.current.on('expensesCleared', () => {
          onExpensesUpdated([]); // Clear the expenses in the parent component
          addMessage('All your expenses have been cleared! Your records are now empty.', 'bot');
        });
      }
    };

    // Set up events after a short delay to ensure socket is ready
    setTimeout(setupSocketEvents, 100);

    // Add welcome message only once
    if (!welcomeShown) {
      setTimeout(() => {
        addMessage('Hello! I\'m HAL\'s Penny, your AI expense tracker. You can tell me things like "I spent $30 on lunch" or ask questions like "What did I spend on food last month?"', 'bot');
        setWelcomeShown(true);
        localStorage.setItem('welcomeShown', 'true');
      }, 1000);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [onExpenseAdded, onExpensesUpdated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (text, sender) => {
    const newMessage = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Add to conversation history for AI context
    setConversationHistory(prev => [...prev, {
      role: sender === 'user' ? 'user' : 'assistant',
      content: text,
      timestamp: newMessage.timestamp
    }]);
  };

  const toggleOptimizeMode = () => {
    const newMode = !optimizeMode;
    setOptimizeMode(newMode);
    localStorage.setItem('optimizeMode', newMode.toString());
  };

  const toggleOfflineMode = () => {
    const newMode = !offlineMode;
    setOfflineMode(newMode);
    localStorage.setItem('offlineMode', newMode.toString());
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return;

    const message = inputMessage.trim();
    setInputMessage('');
    addMessage(message, 'user');

    // Check if it's a confirmation to save expense
    if (/yes|yep|yup|sure|ok|okay|save/i.test(message) && pendingExpense) {
      setIsTyping(true);
      socketRef.current.emit('saveExpense', pendingExpense);
      setPendingExpense(null);
      return;
    }

    // Let the backend AI classify all messages with conversation history
    setIsTyping(true);
    socketRef.current.emit('parseExpense', { 
      message,
      conversationHistory: conversationHistory.slice(-10), // Send last 10 messages for context
      optimizeMode: optimizeMode,
      offlineMode: offlineMode
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>🤖 HAL's Penny</h2>
        <div className="header-controls">
          <button 
            className={`optimize-toggle ${optimizeMode ? 'active' : ''}`}
            onClick={toggleOptimizeMode}
            title={optimizeMode ? 'Optimize Mode: Reduced token usage' : 'Regular Mode: Full AI responses'}
          >
            {optimizeMode ? '⚡ Optimize' : '🔧 Regular'}
          </button>
          <button 
            className={`offline-toggle ${offlineMode ? 'active' : ''}`}
            onClick={toggleOfflineMode}
            title={offlineMode ? 'Offline Mode: Uses fallback parsing' : 'Online Mode: Uses AI services'}
          >
            {offlineMode ? '📴 Offline' : '🌐 Online'}
          </button>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="chat-messages" ref={messagesEndRef}>
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-avatar">
              {message.sender === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <div className="message-time">{formatTime(message.timestamp)}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message bot typing">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (e.g., 'I spent $30 on lunch' or 'What did I spend on food last month?')"
            disabled={!isConnected}
          />
          <button 
            onClick={sendMessage} 
            disabled={!inputMessage.trim() || !isConnected}
            className="send-button"
          >
            ➤
          </button>
        </div>
        <div className="chat-suggestions">
          <button 
            className="suggestion-btn"
            onClick={() => setInputMessage('I spent $25 on coffee')}
          >
            💰 Add Expense
          </button>
          <button 
            className="suggestion-btn"
            onClick={() => setInputMessage('What did I spend on food last month?')}
          >
            📊 Query Expenses
          </button>
          <button 
            className="suggestion-btn"
            onClick={() => setInputMessage('Show me my spending summary')}
          >
            📈 Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

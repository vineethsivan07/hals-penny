import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Bot, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ReceiptUpload from './ReceiptUpload';
import ChatInput from './ChatInput';
import './ChatInterface.css';

const ChatInterface = ({ onExpenseAdded, onExpensesUpdated, onShowChart, onShowDailyAnalytics, onClearAllExpenses, userProfile, error }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingExpense, setPendingExpense] = useState(null);
  const [welcomeShown, setWelcomeShown] = useState(() => {
    return localStorage.getItem('welcomeShown') === 'true';
  });
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const socketRef = useRef(null);
  const welcomeMessageAdded = useRef(false);

  useEffect(() => {
    // Add default welcome message if no messages exist and welcome message hasn't been added yet
    if (messages.length === 0 && !welcomeMessageAdded.current) {
      addMessage("Hello! I'm HAL's Penny, your personal finance advisor. I specialize in expense tracking, budget analysis, and financial planning. I can help you understand your spending habits and make informed financial decisions. Try saying something like 'I spent $25 on coffee' or 'Show me my spending summary'!", 'bot');
      welcomeMessageAdded.current = true;
    }

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

        socketRef.current.on('expenseSaved', (expense) => {
          console.log('✅ Expense saved confirmation received:', expense);
          onExpenseAdded(expense);
          addMessage(`Got it! I've saved your ${expense.description} expense of $${expense.amount} to your records.`, 'bot');
        });

        socketRef.current.on('expenseParsed', (data) => {
          console.log('📝 Expense parsed received:', data);
          setIsTyping(false);
          const expense = data.expense || data; // Handle both formats
          console.log('📝 Setting pending expense:', expense);
          setPendingExpense(expense);
          // Generate natural language response based on expense details
          const naturalResponse = generateNaturalExpenseResponse(expense);
          addMessage(naturalResponse, 'bot');
          addMessage('Should I add this to your expense records?', 'bot');
        });

        socketRef.current.on('expenseRejected', (data) => {
          setIsTyping(false);
          setPendingExpense(null);
          addMessage('Got it! I won\'t add that expense.', 'bot');
        });

        socketRef.current.on('parseError', (error) => {
          setIsTyping(false);
          addMessage('Sorry, I couldn\'t understand that. Could you try rephrasing?', 'bot');
        });

        socketRef.current.on('queryResponse', (data) => {
          console.log('📊 Query response received:', data);
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

  // Load more messages for infinite scroll
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    try {
      // Simulate loading more messages (in a real app, this would fetch from API)
      const moreMessages = [
        { id: `old-${Date.now()}-1`, text: "This is an older message", sender: 'bot', timestamp: Date.now() - 10000 },
        { id: `old-${Date.now()}-2`, text: "Another older message", sender: 'user', timestamp: Date.now() - 15000 },
        { id: `old-${Date.now()}-3`, text: "Even older message", sender: 'bot', timestamp: Date.now() - 20000 }
      ];
      
      // Add messages to the beginning of the array
      setMessages(prevMessages => [...moreMessages, ...prevMessages]);
      setCurrentPage(prev => prev + 1);
      
      // Simulate reaching the end after a few pages
      if (currentPage >= 3) {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle scroll events for infinite scroll
  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    
    // Load more messages when scrolled to top
    if (scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
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


  const generateNaturalExpenseResponse = (expense) => {
    const { description, amount, category } = expense;
    
    // Generate natural language responses based on expense details
    const responses = [
      `I see you spent $${amount} on ${description}. That's categorized as ${category}.`,
      `Got it! $${amount} for ${description} - I've put that under ${category}.`,
      `I found a $${amount} expense for ${description} in the ${category} category.`,
      `You spent $${amount} on ${description}. I've categorized this as ${category}.`,
      `I see ${description} for $${amount} - that's a ${category} expense.`,
      `$${amount} for ${description}? I've marked that as ${category}.`
    ];
    
    // Randomly select a response for variety
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleClearChat = () => {
    // Add confirmation message first
    addMessage('Chat cleared successfully! Your expenses are still saved.', 'bot');
    
    // Clear chat messages after a short delay to show the confirmation
    setTimeout(() => {
      setMessages([]);
      setConversationHistory([]);
      setPendingExpense(null);
      welcomeMessageAdded.current = false; // Reset welcome message flag
      
      // Add the default welcome message after clearing
      setTimeout(() => {
        addMessage("Hello! I'm HAL's Penny, your personal finance advisor. I specialize in expense tracking, budget analysis, and financial planning. I can help you understand your spending habits and make informed financial decisions. Try saying something like 'I spent $25 on coffee' or 'Show me my spending summary'!", 'bot');
        welcomeMessageAdded.current = true;
      }, 200);
    }, 1000);
  };

  const formatAIInsights = (insights, service) => {
    // Create a visually appealing format with bullet points, warnings, and actions
    const header = `🤖 **AI Insights** (Powered by ${service.toUpperCase()})\n\n`;
    
    // Split insights into sections and format them
    const lines = insights.split('\n');
    let formatted = header;
    
    let currentSection = '';
    let inList = false;
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Detect section headers
      if (line.includes('**') || line.includes('Key') || line.includes('Category') || 
          line.includes('Recommendations') || line.includes('Budget') || line.includes('Patterns') ||
          line.includes('Warnings') || line.includes('Positive')) {
        if (inList) {
          formatted += '\n';
          inList = false;
        }
        formatted += `\n📊 **${line.replace(/\*\*/g, '').trim()}**\n`;
        currentSection = line.toLowerCase();
      }
      // Detect bullet points or list items
      else if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || 
               line.match(/^\d+\./) || line.includes('Consider') || line.includes('Try') || 
               line.includes('You could') || line.includes('I notice') || line.includes('Set') ||
               line.includes('Track') || line.includes('Review')) {
        if (!inList) {
          inList = true;
        }
        
        // Format different types of items
        if (line.includes('warning') || line.includes('concern') || line.includes('high') || 
            line.includes('excessive') || line.includes('over') || line.includes('too much') ||
            line.includes('limited') || line.includes('attention')) {
          formatted += `⚠️ ${line.replace(/^[-•*]\s*/, '').trim()}\n`;
        } else if (line.includes('recommend') || line.includes('suggest') || line.includes('try') || 
                   line.includes('consider') || line.includes('action') || line.includes('Set') ||
                   line.includes('Track') || line.includes('Review')) {
          formatted += `💡 ${line.replace(/^[-•*]\s*/, '').trim()}\n`;
        } else if (line.includes('good') || line.includes('great') || line.includes('excellent') || 
                   line.includes('well') || line.includes('consistent') || line.includes('job')) {
          formatted += `✅ ${line.replace(/^[-•*]\s*/, '').trim()}\n`;
        } else {
          formatted += `• ${line.replace(/^[-•*]\s*/, '').trim()}\n`;
        }
      }
      // Regular paragraphs
      else {
        if (inList) {
          formatted += '\n';
          inList = false;
        }
        formatted += `${line}\n`;
      }
    }
    
    // Add footer with action items
    formatted += `\n\n🎯 **Quick Actions:**\n`;
    formatted += `• 📊 View detailed charts\n`;
    formatted += `• 📅 Check daily analytics\n`;
    formatted += `• 💰 Set budget goals\n`;
    formatted += `• 📝 Track more expenses\n`;
    
    return formatted;
  };

  const handleAIInsights = async () => {
    try {
      addMessage('🤖 Analyzing your spending patterns...', 'bot');
      setIsTyping(true);
      
      const userId = currentUser?.uid || 'anonymous';
      const response = await fetch(`http://localhost:3000/api/expenses/insights?userId=${userId}`);
      const data = await response.json();
      
      setIsTyping(false);
      
      if (data.insights) {
        // Format insights with visual elements
        const formattedInsights = formatAIInsights(data.insights, data.service);
        addMessage(formattedInsights, 'bot');
      } else {
        addMessage('Sorry, I couldn\'t generate insights at the moment. Please try again later.', 'bot');
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setIsTyping(false);
      addMessage('Sorry, I couldn\'t generate insights at the moment. Please try again later.', 'bot');
    }
  };



  // Handle expense confirmation
  const handleExpenseConfirmation = (message) => {
    if (/yes|yep|yup|sure|ok|okay|save/i.test(message) && pendingExpense) {
      console.log('✅ Confirmation detected, saving expense:', pendingExpense);
      setIsTyping(true);
      socketRef.current.emit('saveExpense', {
        ...pendingExpense,
        userId: currentUser?.uid || 'anonymous'
      });
      setPendingExpense(null);
      return true;
    }
    return false;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-interface">
      {/* Header Section */}
      <div className="panel-header">
        <div className="header-left">
          <div className="app-logo">
            <div className="logo-icon">💰</div>
            <h1 className="app-title">HAL's Penny</h1>
            <span 
              className="connection-status" 
              title={isConnected ? 'Connected' : 'Disconnected'}
            >
              {isConnected ? '🟢' : '🔴'}
            </span>
          </div>
          {error && (
            <div className="error-message">
              <p>⚠️ {error}</p>
            </div>
          )}
        </div>
        <div className="header-right">
          {userProfile}
        </div>
      </div>
      
      {/* Chat Area */}
      <main className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
        <div className="messages-container">
          {/* Loading indicator for infinite scroll */}
          {isLoadingMore && (
            <div className="loading-more">
              <div className="loading-spinner"></div>
              <span>Loading more messages...</span>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`message-wrapper ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}>
              <div className="message-content">
                <div className={`message-avatar ${message.sender === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                  {message.sender === 'user' ? <User size={16} /> : <span className="bot-logo">💰</span>}
                </div>
                <div className={`message-bubble ${message.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                  <div className="message-text" dangerouslySetInnerHTML={{
                    __html: message.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br>')
                  }}></div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message-wrapper bot-message">
              <div className="message-content">
                <div className="message-avatar bot-avatar">
                  <span className="bot-logo">💰</span>
                </div>
                <div className="message-bubble bot-bubble">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Input Bar */}
      <ChatInput 
        onSend={(message) => {
          // Add user message
          addMessage(message, 'user');
          
          // Check for expense confirmation first
          if (handleExpenseConfirmation(message)) {
            return;
          }
          
          // Send to backend
          if (socketRef.current) {
            setIsTyping(true);
            socketRef.current.emit('parseExpense', {
              message,
              userId: currentUser?.uid || 'anonymous',
              conversationHistory: conversationHistory.slice(-10)
            });
          }
        }}
        onImage={(file) => {
          // Handle image capture - you can process the image here
          console.log('Image captured:', file);
          // For now, just show a message
          addMessage(`📸 Image captured: ${file.name}`, 'user');
        }}
        onVoice={(transcript) => {
          // Add user message
          addMessage(transcript, 'user');
          
          // Check for expense confirmation first
          if (handleExpenseConfirmation(transcript)) {
            return;
          }
          
          // Send to backend
          if (socketRef.current) {
            setIsTyping(true);
            socketRef.current.emit('parseExpense', {
              message: transcript,
              userId: currentUser?.uid || 'anonymous',
              conversationHistory: conversationHistory.slice(-10)
            });
          }
        }}
      />
        
        <div className="chat-actions">
          <button className="action-button" onClick={onShowChart}>
            📊 Show Charts
          </button>
          <button className="action-button" onClick={onShowDailyAnalytics}>
            📅 Daily Analytics
          </button>
          <button className="action-button" onClick={onClearAllExpenses}>
            🧹 Clear All Expenses
          </button>
          <button className="action-button" onClick={handleClearChat}>
            💬 Clear Chat
          </button>
          <button className="action-button" onClick={handleAIInsights}>
            🤖 AI Insights
          </button>
        </div>

      {showReceiptUpload && (
        <ReceiptUpload
          onReceiptProcessed={(expense) => {
            // Add the extracted expense to messages
            addMessage(`I found a receipt for ${expense.description} - $${expense.amount}`, 'user');
            // Process the expense through the normal flow
            if (socketRef.current) {
              socketRef.current.emit('parseExpense', {
                message: `I spent $${expense.amount} on ${expense.description}`,
                userId: currentUser?.uid || 'anonymous',
                conversationHistory
              });
            }
            setShowReceiptUpload(false);
          }}
          onClose={() => setShowReceiptUpload(false)}
        />
      )}
    </div>
  );
};

export default ChatInterface;

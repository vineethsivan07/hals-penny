import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import AppContent from './components/AppContent';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AuthGuard>
            <AppContent />
          </AuthGuard>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
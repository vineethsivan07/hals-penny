import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { recaptchaVerifier } from '../firebase/config';
import './AuthForm.css';

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, signInWithGoogle, signInWithApple } = useAuth();

  // Initialize reCAPTCHA on component mount
  useEffect(() => {
    const initializeRecaptcha = async () => {
      try {
        if (recaptchaVerifier && recaptchaVerifier.render) {
          const widgetId = await recaptchaVerifier.render();
          console.log('reCAPTCHA widget rendered with ID:', widgetId);
        } else {
          console.log('reCAPTCHA verifier not available, using fallback');
        }
      } catch (error) {
        console.error('reCAPTCHA render error:', error);
      }
    };

    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(initializeRecaptcha, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      try {
        if (recaptchaVerifier && recaptchaVerifier.clear) {
          recaptchaVerifier.clear();
        }
      } catch (error) {
        console.error('reCAPTCHA cleanup error:', error);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      console.log('Attempting Google sign-in...');
      console.log('Firebase config:', {
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'halls-penny.firebaseapp.com',
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'halls-penny'
      });
      
      // Verify reCAPTCHA before proceeding (with fallback)
      try {
        if (recaptchaVerifier && recaptchaVerifier.verify) {
          const recaptchaToken = await recaptchaVerifier.verify();
          console.log('reCAPTCHA verified:', recaptchaToken);
        } else {
          console.log('reCAPTCHA not available, proceeding without verification');
        }
      } catch (recaptchaError) {
        console.warn('reCAPTCHA verification failed, proceeding anyway:', recaptchaError);
      }
      
      const result = await signInWithGoogle();
      console.log('Google sign-in successful:', result);
    } catch (error) {
      console.error('Google sign-in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error.code === 'auth/configuration-not-found') {
        setError('❌ Google authentication is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method → Google → Enable');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/internal-error') {
        setError('❌ Google sign-in configuration error. Please check Firebase Console settings and try again. See FIREBASE_CONSOLE_SETUP.md for detailed steps.');
      } else if (error.code === 'auth/argument-error') {
        setError('❌ Authentication configuration error. Please check your Firebase settings and try again. See FIREBASE_CONSOLE_SETUP.md for detailed steps.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('❌ Domain not authorized. Please add localhost to authorized domains in Firebase Console → Authentication → Settings → Authorized domains');
      } else if (error.code === 'auth/captcha-check-failed') {
        setError('reCAPTCHA verification failed. Please try again.');
      } else if (error.code === 'auth/invalid-verification-code') {
        setError('Invalid verification code. Please try again.');
      } else {
        setError(`❌ Google sign-in failed: ${error.message} (Code: ${error.code}). Check FIREBASE_CONSOLE_SETUP.md for configuration steps.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithApple();
    } catch (error) {
      console.error('Apple sign-in error:', error);
      if (error.code === 'auth/configuration-not-found') {
        setError('Apple authentication is not enabled. Please enable it in Firebase Console.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else {
        setError(`Apple sign-in failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🤖 HAL's Penny</h1>
          <p>Sign in to track your expenses with AI</p>
          <div className="auth-info">
            <p>💡 <strong>First time?</strong> Enable Google/Apple authentication in Firebase Console</p>
            <p>🔧 <strong>Getting errors?</strong> Check FIREBASE_CONSOLE_SETUP.md for step-by-step configuration</p>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">Full Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={!isLogin}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={loading}
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="oauth-buttons">
          <button 
            className="oauth-button google"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="oauth-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.69l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button 
            className="oauth-button apple"
            onClick={handleAppleSignIn}
            disabled={loading}
          >
            <svg className="oauth-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              className="switch-button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* reCAPTCHA container - invisible */}
        <div id="recaptcha-container" style={{ display: 'none' }}></div>
      </div>
    </div>
  );
}

export default AuthForm;

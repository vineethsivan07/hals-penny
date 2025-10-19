import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider, appleProvider, recaptchaVerifier } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [hasSelectedPlan, setHasSelectedPlan] = useState(false);

  // Sign up function
  async function signup(email, password, displayName) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      if (displayName) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Sign in function
  async function login(email, password) {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  }

  // Sign out function
  async function logout() {
    try {
      return await signOut(auth);
    } catch (error) {
      throw error;
    }
  }

  // Reset password function
  async function resetPassword(email) {
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async function updateUserProfile(updates) {
    try {
      return await updateProfile(currentUser, updates);
    } catch (error) {
      throw error;
    }
  }

  // Google sign in
  async function signInWithGoogle() {
    try {
      // Verify reCAPTCHA before sign-in (with fallback)
      try {
        if (recaptchaVerifier && recaptchaVerifier.verify) {
          const recaptchaToken = await recaptchaVerifier.verify();
          console.log('reCAPTCHA verified for Google sign-in:', recaptchaToken);
        } else {
          console.log('reCAPTCHA not available, proceeding without verification');
        }
      } catch (recaptchaError) {
        console.warn('reCAPTCHA verification failed, proceeding anyway:', recaptchaError);
      }
      
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  // Apple sign in
  async function signInWithApple() {
    try {
      return await signInWithPopup(auth, appleProvider);
    } catch (error) {
      throw error;
    }
  }

  // Load user subscription preference
  useEffect(() => {
    if (currentUser) {
      loadUserPreferences();
    }
  }, [currentUser]);

  async function loadUserPreferences() {
    try {
      const response = await fetch(`http://localhost:3000/api/user/preferences/${currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptionPlan(data.subscriptionPlan);
        setHasSelectedPlan(!!data.subscriptionPlan);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }

  async function saveSubscriptionPlan(plan) {
    console.log('saveSubscriptionPlan called with plan:', plan);
    try {
      const response = await fetch('http://localhost:3000/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          subscriptionPlan: plan,
          email: currentUser.email,
          displayName: currentUser.displayName
        }),
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', response.headers);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('API response data:', responseData);
        console.log('Setting subscription plan state:', plan);
        setSubscriptionPlan(plan);
        setHasSelectedPlan(true);
        console.log('State updated - hasSelectedPlan should be true');
        return true;
      } else {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error saving subscription plan:', error);
      return false;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    updateUserProfile,
    signInWithGoogle,
    signInWithApple,
    subscriptionPlan,
    hasSelectedPlan,
    saveSubscriptionPlan
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

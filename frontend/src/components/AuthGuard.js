import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from './AuthForm';

export default function AuthGuard({ children }) {
  const { currentUser } = useAuth();

  // If user is authenticated, show the protected content
  if (currentUser) {
    return children;
  }

  // If user is not authenticated, show the unified auth form
  return <AuthForm />;
}

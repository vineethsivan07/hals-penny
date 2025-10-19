import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

export default function UserProfile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }

    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile]);

  async function handleLogout() {
    console.log('Logout button clicked');
    try {
      await logout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  function handleProfileDetails() {
    console.log('Profile details button clicked');
    navigate('/profile');
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="user-profile" ref={profileRef}>
      <button 
        className="profile-trigger"
        onClick={() => setShowProfile(!showProfile)}
        title={`${currentUser.displayName || currentUser.email.split('@')[0]} - Click to view profile`}
      >
        <div className="user-avatar">
          {currentUser.displayName ? 
            currentUser.displayName.charAt(0).toUpperCase() : 
            currentUser.email.charAt(0).toUpperCase()
          }
        </div>
      </button>

      {showProfile && (
        <div className="profile-dropdown">
          <div className="profile-info">
            <div className="profile-avatar-large">
              {currentUser.displayName ? 
                currentUser.displayName.charAt(0).toUpperCase() : 
                currentUser.email.charAt(0).toUpperCase()
              }
            </div>
            <div className="profile-details">
              <div className="profile-name">
                {currentUser.displayName || 'User'}
              </div>
              <div className="profile-email">
                {currentUser.email}
              </div>
              <div className="profile-provider">
                {currentUser.providerData && currentUser.providerData.length > 0 && (
                  <span className="provider-badge">
                    {currentUser.providerData[0].providerId === 'google.com' ? '🔵 Google' :
                     currentUser.providerData[0].providerId === 'apple.com' ? '🍎 Apple' :
                     '📧 Email'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="profile-actions">
            <button 
              className="profile-details-button"
              onClick={handleProfileDetails}
            >
              <span className="profile-icon">👤</span>
              Profile Details
            </button>
            <button 
              className="logout-button"
              onClick={handleLogout}
            >
              <span className="logout-icon">🚪</span>
              Sign Out
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

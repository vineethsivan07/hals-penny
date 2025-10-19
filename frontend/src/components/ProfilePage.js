import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ProfilePage.css';

function ProfilePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleBackToChat = () => {
    navigate('/');
  };

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <button 
          className="back-button"
          onClick={handleBackToChat}
        >
          ← Back to Chat
        </button>
        <h1>Profile</h1>
      </div>
      
      <div className="profile-page-content">
        <div className="profile-info">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
          
          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">Name:</span>
              <span className="detail-value">
                {currentUser?.displayName || 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

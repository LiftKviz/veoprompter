import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/services/paymentService';
import './Settings.css';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { userState, getRemainingModifications, signOut, signIn } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleUpgrade = async () => {
    // Check if user is signed in first
    if (!userState.isSignedIn) {
      alert('Please sign in first to upgrade to Pro.');
      return;
    }
    
    try {
      await paymentService.openPaymentPage();
    } catch (error) {
      console.error('Failed to open payment page:', error);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
      alert('Sign in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
      onClose(); // Close settings modal after sign out
    }
  };

  return (
    <div 
      className="settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="settings-modal">
        <div className="settings-header">
          <h2 id="settings-title">Account & Settings</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>
        
        <div className="settings-content">
          {/* Account Status */}
          <div className="setting-group">
            <h3>Account Status</h3>
            <div className="account-info">
              <div className="status-item">
                <span className="label">Plan:</span>
                <span className={`status-badge tier-${userState.tier}`}>
                  {userState.tier === 'paid' ? 'Pro' : userState.tier === 'free' ? 'Free' : 'Anonymous'}
                </span>
              </div>
              
              {userState.tier === 'free' && (
                <div className="status-item">
                  <span className="label">Daily Modifications:</span>
                  <span className="usage-count">
                    {getRemainingModifications()}/3 remaining
                  </span>
                </div>
              )}
              
              {userState.isSignedIn && (
                <div className="status-item">
                  <span className="label">Status:</span>
                  <span className="signed-in">✓ Signed In</span>
                </div>
              )}
            </div>
            
          </div>

          {/* Sign In / Upgrade Section */}
          {!userState.isSignedIn ? (
            <div className="setting-group sign-in-section">
              <h3>Sign In Required</h3>
              <p>Sign in to access premium features and upgrade to Pro.</p>
              <div className="upgrade-features">
                <div className="feature">✨ Save your favorite prompts</div>
                <div className="feature">🎯 Track your usage</div>
                <div className="feature">🚀 Unlock Pro features</div>
              </div>
              <button 
                className="sign-in-button primary" 
                onClick={handleSignIn}
                disabled={isSigningIn}
              >
                {isSigningIn ? 'Signing In...' : '👤 Sign In with Google'}
              </button>
            </div>
          ) : userState.tier !== 'paid' && (
            <div className="setting-group upgrade-section">
              <h3>Upgrade to Pro</h3>
              <div className="upgrade-features">
                <div className="feature">✨ Unlimited prompt modifications</div>
                <div className="feature">🎯 Priority support</div>
                <div className="feature">🚀 Advanced features</div>
              </div>
              <button className="upgrade-button" onClick={handleUpgrade}>
                Upgrade to Pro - $6.99/mo
              </button>
            </div>
          )}

          {/* About */}
          <div className="setting-group">
            <h3>About</h3>
            <p className="about-text">
              Veo 3 Prompt Assistant helps you create better prompts for Google's Veo 3 video AI model.
            </p>
            <div className="links">
              <button 
                className="link-button" 
                onClick={() => setShowFeedbackModal(true)}
              >
                💬 Support & Feedback
              </button>
            </div>
          </div>
        </div>
        
        <div className="settings-footer">
          {userState.isSignedIn && (
            <button className="sign-out-button" onClick={handleSignOut}>
              🚪 Sign Out
            </button>
          )}
          <button className="primary" onClick={onClose}>Close</button>
        </div>
      </div>
      
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="feedback-overlay">
          <div className="feedback-modal">
            <div className="feedback-header">
              <h3>💬 Support & Feedback</h3>
              <button 
                className="close-button" 
                onClick={() => setShowFeedbackModal(false)}
                aria-label="Close feedback modal"
              >
                ✕
              </button>
            </div>
            <div className="feedback-content">
              <p>We'd love to hear from you! Your feedback helps us improve Veo 3 Prompt Assistant.</p>
              <div className="feedback-options">
                <div className="feedback-option">
                  <h4>📧 Email us directly</h4>
                  <p>Got suggestions, bugs, or questions?</p>
                  <a 
                    href="mailto:nemanja@memekitchen.ai?subject=Veo 3 Prompt Assistant Feedback"
                    className="email-link"
                  >
                    nemanja@memekitchen.ai
                  </a>
                </div>
              </div>
            </div>
            <div className="feedback-footer">
              <button 
                className="secondary" 
                onClick={() => setShowFeedbackModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
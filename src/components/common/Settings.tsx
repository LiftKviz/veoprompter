import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import './Settings.css';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { userState, getRemainingModifications, signOut } = useAuth();

  const handleUpgrade = () => {
    // TODO: Implement upgrade flow
    window.open('https://your-upgrade-url.com', '_blank');
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

          {/* Upgrade Section */}
          {userState.tier !== 'paid' && (
            <div className="setting-group upgrade-section">
              <h3>Upgrade to Pro</h3>
              <div className="upgrade-features">
                <div className="feature">✨ Unlimited prompt modifications</div>
                <div className="feature">🎯 Priority support</div>
                <div className="feature">🚀 Advanced features</div>
              </div>
              <button className="upgrade-button" onClick={handleUpgrade}>
                Upgrade to Pro
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
              <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="https://your-support-url.com" target="_blank" rel="noopener noreferrer">
                Support
              </a>
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
    </div>
  );
};
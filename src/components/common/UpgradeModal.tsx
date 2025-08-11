/**
 * Upgrade Modal Component
 * Shows when users try to access features beyond their tier
 */

import React, { useState } from 'react';
import { UserState } from '@/services/authService';
import './UpgradeModal.css';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  message: string;
  userState: UserState;
  onSignIn?: () => Promise<void>;
  onAddApiKey?: () => void;
  onUpgrade?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  feature,
  message,
  userState,
  onSignIn,
  onUpgrade
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    if (!onSignIn) return;
    
    setIsSigningIn(true);
    try {
      await onSignIn();
      onClose();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const renderSignInOption = () => (
    <div className="upgrade-option">
      <div className="option-icon">👤</div>
      <h3>Sign Up Free</h3>
      <p>Create a free account to save prompts and track your favorites</p>
      <ul className="feature-list">
        <li>✓ Save unlimited prompts</li>
        <li>✓ Organize your favorites</li>
        <li>✓ 10 free AI generations</li>
      </ul>
      <button 
        className="option-button primary"
        onClick={handleSignIn}
        disabled={isSigningIn}
      >
        {isSigningIn ? 'Signing in...' : 'Sign Up with Google'}
      </button>
    </div>
  );

  const renderUpgradeOption = () => (
    <div className="upgrade-option featured">
      <div className="option-icon">⭐</div>
      <h3>Upgrade to Pro</h3>
      <p>Unlock unlimited AI modifications and premium features</p>
      <ul className="feature-list">
        <li>✓ Unlimited AI prompt modifications</li>
        <li>✓ Create unlimited new prompts</li>
        <li>✓ Priority support</li>
        <li>✓ Advanced features</li>
      </ul>
      <button 
        className="option-button premium"
        onClick={onUpgrade}
      >
        Upgrade to Pro - $19/mo
      </button>
      <span className="option-note">Best value for creators</span>
    </div>
  );


  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="upgrade-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>Unlock {feature}</h2>
          <p className="modal-message">{message}</p>
        </div>

        <div className="upgrade-options">
          {!userState.isSignedIn && renderSignInOption()}
          
          {userState.isSignedIn && renderUpgradeOption()}
        </div>

        {userState.isSignedIn && userState.tier === 'free' && (
          <div className="usage-remaining">
            <span className="usage-badge">
              {3 - userState.dailyModificationsUsed}/3 free modifications today
            </span>
          </div>
        )}
      </div>
    </>
  );
};
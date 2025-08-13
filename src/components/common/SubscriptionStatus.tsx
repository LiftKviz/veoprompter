import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/services/paymentService';
import './SubscriptionStatus.css';

interface SubscriptionStatusProps {
  onUpgradeClick?: () => void;
  showDetailsButton?: boolean;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  onUpgradeClick, 
  showDetailsButton = true 
}) => {
  const { userState, getRemainingModifications } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  const remainingModifications = getRemainingModifications();
  const shouldShow = userState.tier === 'free' && remainingModifications === 0 && isVisible;

  const handleUpgrade = async () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      try {
        await paymentService.openPaymentPage();
      } catch (error) {
        console.error('Failed to open payment page:', error);
      }
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Only show if user is on free tier and has no modifications left
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="subscription-banner">
      <button 
        className="banner-close" 
        onClick={handleClose}
        aria-label="Close banner"
      >
        ×
      </button>
      
      <div className="banner-content">
        <div className="banner-icon">⚡</div>
        <div className="banner-text">
          <h4>Out of free modifications</h4>
          <p>You've used all 3 daily modifications. Upgrade to continue.</p>
        </div>
      </div>
      
      <div className="banner-actions">
        <button 
          className="upgrade-button"
          onClick={handleUpgrade}
        >
          Upgrade Now
        </button>
        {showDetailsButton && (
          <button 
            className="details-button"
            onClick={handleUpgrade}
          >
            View Plans
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;
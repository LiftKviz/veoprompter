import React, { useState, useEffect } from 'react';
import { paymentService, PaymentUser } from '../../services/paymentService';
import './SubscriptionStatus.css';

interface SubscriptionStatusProps {
  onUpgradeClick?: () => void;
  showDetailsButton?: boolean;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  onUpgradeClick, 
  showDetailsButton = true 
}) => {
  const [user, setUser] = useState<PaymentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<{
    gptModifications: number;
    savedPrompts: number;
  }>({ gptModifications: 0, savedPrompts: 0 });

  useEffect(() => {
    loadUserData();
    
    // Listen for payment status changes
    const handlePaymentChange = (message: any) => {
      if (message.type === 'PAYMENT_STATUS_CHANGED') {
        setUser(message.user);
        loadUsageData();
      }
    };

    chrome.runtime.onMessage.addListener(handlePaymentChange);
    return () => chrome.runtime.onMessage.removeListener(handlePaymentChange);
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await paymentService.getUser();
      setUser(userData);
      await loadUsageData();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageData = async () => {
    try {
      const [gptRemaining, savedRemaining] = await Promise.all([
        paymentService.getRemainingUsage('gpt_modification'),
        paymentService.getRemainingUsage('saved_prompt')
      ]);

      setUsageData({
        gptModifications: gptRemaining,
        savedPrompts: savedRemaining
      });
    } catch (error) {
      console.error('Error loading usage data:', error);
    }
  };

  const handleUpgrade = async () => {
    try {
      if (onUpgradeClick) {
        onUpgradeClick();
      } else {
        await paymentService.openPaymentPage();
      }
    } catch (error) {
      console.error('Error opening payment page:', error);
    }
  };

  if (loading) {
    return (
      <div className="subscription-status loading">
        <div className="status-indicator"></div>
        <span>Loading subscription...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="subscription-status error">
        <div className="status-indicator error"></div>
        <span>Unable to load subscription status</span>
      </div>
    );
  }

  const isPremium = user.paid && user.subscriptionStatus === 'active';

  return (
    <div className={`subscription-status ${isPremium ? 'premium' : 'free'}`}>
      <div className="status-header">
        <div className={`status-indicator ${isPremium ? 'premium' : 'free'}`}></div>
        <div className="status-info">
          <span className="status-label">
            {isPremium ? 'Premium' : 'Free'}
          </span>
          {isPremium && user.subscriptionStatus && (
            <span className="subscription-details">
              {user.subscriptionStatus === 'active' ? 'Active' : user.subscriptionStatus}
            </span>
          )}
        </div>
      </div>

      {!isPremium && (
        <div className="usage-limits">
          <div className="usage-item">
            <span>AI Modifications:</span>
            <span className={usageData.gptModifications === 0 ? 'limit-reached' : ''}>
              {usageData.gptModifications === -1 ? '∞' : usageData.gptModifications} left today
            </span>
          </div>
          <div className="usage-item">
            <span>Saved Prompts:</span>
            <span className={usageData.savedPrompts === 0 ? 'limit-reached' : ''}>
              {usageData.savedPrompts === -1 ? '∞' : usageData.savedPrompts} remaining
            </span>
          </div>
        </div>
      )}

      <div className="status-actions">
        {!isPremium && (
          <button 
            className="upgrade-button"
            onClick={handleUpgrade}
          >
            Upgrade to Premium
          </button>
        )}
        
        {showDetailsButton && (
          <button 
            className="details-button"
            onClick={handleUpgrade}
          >
            {isPremium ? 'Manage Subscription' : 'View Plans'}
          </button>
        )}
      </div>

      {isPremium && user.paidAt && (
        <div className="premium-since">
          Premium since {user.paidAt.toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
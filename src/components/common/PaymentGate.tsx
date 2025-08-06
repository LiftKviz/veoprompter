import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/paymentService';
import './PaymentGate.css';

interface PaymentGateProps {
  feature: 'gpt_modification' | 'unlimited_saves' | 'advanced_search' | 'custom_categories';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const PaymentGate: React.FC<PaymentGateProps> = ({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}) => {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [usageRemaining, setUsageRemaining] = useState<number>(-1);

  useEffect(() => {
    checkAccess();
  }, [feature]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const canUse = await paymentService.canUseFeature(feature);
      setHasAccess(canUse);

      // Get usage remaining for usage-based features
      if (['gpt_modification', 'unlimited_saves'].includes(feature)) {
        const remaining = await paymentService.getRemainingUsage(
          feature === 'gpt_modification' ? 'gpt_modification' : 'saved_prompt'
        );
        setUsageRemaining(remaining);
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = async () => {
    try {
      await paymentService.openPaymentPage();
    } catch (error) {
      console.error('Error opening payment page:', error);
    }
  };

  const getFeatureDisplayName = (feature: string): string => {
    const names = {
      'gpt_modification': 'AI Prompt Modification',
      'unlimited_saves': 'Unlimited Saved Prompts', 
      'advanced_search': 'Advanced Search',
      'custom_categories': 'Custom Categories'
    };
    return names[feature as keyof typeof names] || feature;
  };

  const getFeatureDescription = (feature: string): string => {
    const descriptions = {
      'gpt_modification': 'Modify prompts with AI assistance to perfectly match your vision',
      'unlimited_saves': 'Save unlimited prompts to your personal library',
      'advanced_search': 'Search with advanced filters and sorting options',
      'custom_categories': 'Create and organize your own prompt categories'
    };
    return descriptions[feature as keyof typeof descriptions] || '';
  };

  if (loading) {
    return (
      <div className="payment-gate loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Show usage warning for limited features
  if (hasAccess && usageRemaining === 0 && ['gpt_modification', 'unlimited_saves'].includes(feature)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="payment-gate usage-limit">
        <div className="gate-content">
          <div className="gate-icon">⚠️</div>
          <div className="gate-text">
            <h3>Daily Limit Reached</h3>
            <p>You've reached your daily limit for {getFeatureDisplayName(feature).toLowerCase()}.</p>
            <p>Upgrade to Premium for unlimited access!</p>
          </div>
          {showUpgradePrompt && (
            <button className="upgrade-button" onClick={handleUpgradeClick}>
              Upgrade Now
            </button>
          )}
        </div>
      </div>
    );
  }

  // Allow access if user has permission
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt
  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <div className="payment-gate premium-required">
      <div className="gate-content">
        <div className="gate-icon">💎</div>
        <div className="gate-text">
          <h3>Premium Feature</h3>
          <p><strong>{getFeatureDisplayName(feature)}</strong></p>
          <p>{getFeatureDescription(feature)}</p>
        </div>
        <button className="upgrade-button" onClick={handleUpgradeClick}>
          Upgrade to Premium
        </button>
      </div>
    </div>
  );
};

export default PaymentGate;
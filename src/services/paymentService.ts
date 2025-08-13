/**
 * Payment Service for Veo 3 Prompt Assistant
 * Integrates ExtPay for subscription management
 */

declare const ExtPay: any;

export interface PaymentUser {
  paid: boolean;
  paidAt?: Date;
  installedAt: Date;
  trialStartedAt?: Date;
  email?: string;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'unpaid';
}

export interface PaymentPlan {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | 'one-time';
}

class PaymentService {
  private extpay: any;
  private initialized = false;
  private readonly EXTENSION_ID = 'veo-3-prompter'; // ExtPay extension ID

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Only initialize ExtPay if we're not in a service worker context
      if (this.isBackgroundScript()) {
        // In background script, ExtPay should be loaded differently
        // Check if ExtPay is available globally
        if (typeof ExtPay !== 'undefined') {
          this.extpay = ExtPay(this.EXTENSION_ID);
          this.extpay.startBackground();
          this.initialized = true;
          console.log('PaymentService initialized in background script');
        } else {
          console.warn('ExtPay not available in background script context');
          this.initialized = false;
          return;
        }
      } else {
        // In popup/content script context, use dynamic import
        const { default: ExtPayLib } = await import('extpay');
        this.extpay = ExtPayLib(this.EXTENSION_ID);
        this.initialized = true;
        console.log('PaymentService initialized in popup context');
      }
    } catch (error) {
      console.error('Failed to initialize PaymentService:', error);
      this.initialized = false;
    }
  }

  private isBackgroundScript(): boolean {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           typeof chrome.runtime.getManifest === 'function' &&
           !chrome.tabs;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
    
    if (!this.extpay) {
      throw new Error('PaymentService not properly initialized');
    }
  }

  /**
   * Get current user's payment status
   */
  async getUser(): Promise<PaymentUser> {
    // If in popup context, get status from background script
    if (!this.isBackgroundScript()) {
      try {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { type: 'GET_PAYMENT_STATUS' },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error('Error getting payment status from background:', chrome.runtime.lastError);
                resolve({
                  paid: false,
                  installedAt: new Date()
                });
              } else {
                resolve(response);
              }
            }
          );
        });
      } catch (error) {
        console.error('Error communicating with background script:', error);
        return {
          paid: false,
          installedAt: new Date()
        };
      }
    }

    // If in background script, use ExtPay directly
    await this.ensureInitialized();
    
    try {
      const user = await this.extpay.getUser();
      return {
        paid: user.paid || false,
        paidAt: user.paidAt ? new Date(user.paidAt) : undefined,
        installedAt: new Date(user.installedAt),
        trialStartedAt: user.trialStartedAt ? new Date(user.trialStartedAt) : undefined,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus
      };
    } catch (error) {
      console.error('Error getting user payment status:', error);
      return {
        paid: false,
        installedAt: new Date()
      };
    }
  }

  /**
   * Check if user has premium access
   */
  async isPremiumUser(): Promise<boolean> {
    const user = await this.getUser();
    return user.paid && user.subscriptionStatus === 'active';
  }

  /**
   * Open ExtPay payment page
   */
  async openPaymentPage(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      this.extpay.openPaymentPage();
    } catch (error) {
      console.error('Error opening payment page:', error);
      throw new Error('Unable to open payment page');
    }
  }

  /**
   * Get available payment plans
   */
  async getPlans(): Promise<PaymentPlan[]> {
    await this.ensureInitialized();
    
    try {
      const plans = await this.extpay.getPlans();
      return plans.map((plan: any) => ({
        id: plan.id,
        title: plan.title,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval
      }));
    } catch (error) {
      console.error('Error getting payment plans:', error);
      return [];
    }
  }

  /**
   * Add listener for payment events
   */
  onPaid(callback: (user: PaymentUser) => void): void {
    if (!this.extpay) {
      console.warn('ExtPay not initialized, payment listener not added');
      return;
    }

    this.extpay.onPaid.addListener((user: any) => {
      const paymentUser: PaymentUser = {
        paid: user.paid || false,
        paidAt: user.paidAt ? new Date(user.paidAt) : undefined,
        installedAt: new Date(user.installedAt),
        trialStartedAt: user.trialStartedAt ? new Date(user.trialStartedAt) : undefined,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus
      };
      callback(paymentUser);
    });
  }

  /**
   * Feature gates for different premium features
   */
  async canUseFeature(feature: 'gpt_modification' | 'unlimited_saves' | 'advanced_search' | 'custom_categories'): Promise<boolean> {
    const isPremium = await this.isPremiumUser();
    
    // Define feature access rules
    const featureRules = {
      'gpt_modification': isPremium, // Premium only
      'unlimited_saves': isPremium, // Premium only  
      'advanced_search': true, // Free for all
      'custom_categories': isPremium // Premium only
    };

    return featureRules[feature] || false;
  }

  /**
   * Get usage limits for free users
   */
  async getUsageLimits(): Promise<{ gptModifications: number; savedPrompts: number }> {
    const isPremium = await this.isPremiumUser();
    
    if (isPremium) {
      return {
        gptModifications: -1, // Unlimited
        savedPrompts: -1 // Unlimited
      };
    }

    return {
      gptModifications: 3, // 3 per day for free users
      savedPrompts: 10 // 10 total for free users
    };
  }

  /**
   * Track usage for free users
   */
  async trackUsage(feature: 'gpt_modification' | 'saved_prompt'): Promise<boolean> {
    const isPremium = await this.isPremiumUser();
    if (isPremium) return true; // No limits for premium users

    const today = new Date().toDateString();
    const storageKey = `usage_${feature}_${today}`;
    
    try {
      const result = await chrome.storage.local.get([storageKey]);
      const currentUsage = result[storageKey] || 0;
      const limits = await this.getUsageLimits();
      
      let limit: number;
      if (feature === 'gpt_modification') {
        limit = limits.gptModifications;
      } else {
        limit = limits.savedPrompts;
      }

      if (currentUsage >= limit) {
        return false; // Usage limit exceeded
      }

      // Increment usage
      await chrome.storage.local.set({
        [storageKey]: currentUsage + 1
      });

      return true;
    } catch (error) {
      console.error('Error tracking usage:', error);
      return false;
    }
  }

  /**
   * Get remaining usage for today
   */
  async getRemainingUsage(feature: 'gpt_modification' | 'saved_prompt'): Promise<number> {
    const isPremium = await this.isPremiumUser();
    if (isPremium) return -1; // Unlimited

    const today = new Date().toDateString();
    const storageKey = `usage_${feature}_${today}`;
    
    try {
      const result = await chrome.storage.local.get([storageKey]);
      const currentUsage = result[storageKey] || 0;
      const limits = await this.getUsageLimits();
      
      let limit: number;
      if (feature === 'gpt_modification') {
        limit = limits.gptModifications;
      } else {
        limit = limits.savedPrompts;
      }

      return Math.max(0, limit - currentUsage);
    } catch (error) {
      console.error('Error getting remaining usage:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
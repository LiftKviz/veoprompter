/**
 * Authentication and Access Control Service
 * Manages user state, API keys, and feature access
 */

import { subscriptionSyncService } from './subscriptionSyncService';

export type UserTier = 'anonymous' | 'free' | 'paid';

export interface UserState {
  isSignedIn: boolean;
  tier: UserTier;
  email?: string;
  userId?: string;
  dailyModificationsUsed: number;
  lastResetDate: string; // ISO date string for tracking daily reset
  hasApiKey?: boolean;
  subscription?: {
    status: 'active' | 'expired' | 'cancelled';
    plan: string;
    expiresAt?: string;
  };
}

export interface FeatureAccess {
  viewPrompts: boolean;
  copyPrompts: boolean;
  savePrompts: boolean;
  modifyPrompts: boolean;
  createPrompts: boolean;
  createSequences: boolean;
  unlimitedUsage: boolean;
}

class AuthService {
  private userState: UserState = {
    isSignedIn: false,
    tier: 'anonymous',
    dailyModificationsUsed: 0,
    lastResetDate: new Date().toISOString().split('T')[0]
  };
  
  private readonly DAILY_FREE_MODIFICATIONS = 3;

  private listeners: Set<(state: UserState) => void> = new Set();

  constructor() {
    this.loadUserState();
    
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        if (changes.user || changes.apiKey) {
          this.loadUserState();
        }
      }
    });
    
    // Listen for usage updates from background script
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message.type === 'USAGE_UPDATED') {
        this.userState.dailyModificationsUsed = message.dailyUsage.count;
        this.userState.lastResetDate = message.dailyUsage.date;
        this.notifyListeners();
      }
    });

    // Listen for payment status changes from background script
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message.type === 'PAYMENT_STATUS_CHANGED') {
        console.log('🎉 Payment status changed broadcast received!');
        this.loadUserState(); // Refresh user state immediately
      }
    });

    // Add periodic ExtPay sync check (every 30 seconds for signed-in free users)
    setInterval(() => {
      this.syncExtPayStatus();
    }, 30000);
  }

  /**
   * Load user state from storage
   */
  private async loadUserState() {
    try {
      const stored = await chrome.storage.local.get(['user', 'dailyUsage', 'subscription']);
      
      // Check if user is signed in (using existing GoogleAuth data)
      if (stored.user && stored.user.email) {
        this.userState.isSignedIn = true;
        this.userState.email = stored.user.email;
        this.userState.userId = stored.user.email;
        this.userState.tier = 'free'; // Default to free tier
      }
      
      // Load daily usage data
      if (stored.dailyUsage) {
        const today = new Date().toISOString().split('T')[0];
        
        // Reset counter if it's a new day
        if (stored.dailyUsage.date !== today) {
          this.userState.dailyModificationsUsed = 0;
          this.userState.lastResetDate = today;
          await this.saveDailyUsage();
        } else {
          this.userState.dailyModificationsUsed = stored.dailyUsage.count || 0;
          this.userState.lastResetDate = stored.dailyUsage.date;
        }
      }
      
      // Check subscription status
      if (stored.subscription && stored.subscription.status === 'active') {
        this.userState.tier = 'paid';
        this.userState.subscription = stored.subscription;
      } else if (this.userState.isSignedIn) {
        // Automatically check ExtPay payment status for signed-in users
        try {
          const paymentStatus = await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({ type: 'GET_PAYMENT_STATUS' }, (response) => {
              resolve(response || { paid: false });
            });
          });
          
          if (paymentStatus.paid) {
            console.log('🎉 ExtPay payment detected! Activating Pro features...');
            
            this.userState.tier = 'paid';
            this.userState.subscription = {
              status: 'active',
              plan: 'pro',
              expiresAt: paymentStatus.paidAt ? 
                new Date(new Date(paymentStatus.paidAt).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() :
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            };
            
            // Save the subscription status to local storage
            await chrome.storage.local.set({ 
              subscription: this.userState.subscription
            });
            
            console.log('✅ Pro features activated automatically!');
          }
        } catch (error) {
          console.error('Failed to check ExtPay payment status:', error);
        }
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load user state:', error);
    }
  }
  
  /**
   * Save daily usage to storage
   */
  private async saveDailyUsage() {
    await chrome.storage.local.set({
      dailyUsage: {
        date: this.userState.lastResetDate,
        count: this.userState.dailyModificationsUsed
      }
    });
  }

  /**
   * Get current user state
   */
  getUserState(): UserState {
    return { ...this.userState };
  }

  /**
   * Get feature access based on user tier
   */
  getFeatureAccess(): FeatureAccess {
    const tier = this.userState.tier;

    switch (tier) {
      case 'anonymous':
        return {
          viewPrompts: true,
          copyPrompts: true,
          savePrompts: false,
          modifyPrompts: false,
          createPrompts: false,
          createSequences: false,
          unlimitedUsage: false
        };

      case 'free':
        return {
          viewPrompts: true,
          copyPrompts: true,
          savePrompts: true,
          modifyPrompts: true, // Always allow access, check limits when used
          createPrompts: true,  // Always allow access, check limits when used
          createSequences: true, // Sequences don't use AI
          unlimitedUsage: false
        };

      case 'paid':
        return {
          viewPrompts: true,
          copyPrompts: true,
          savePrompts: true,
          modifyPrompts: true,
          createPrompts: true,
          createSequences: true,
          unlimitedUsage: true
        };

      default:
        return {
          viewPrompts: true,
          copyPrompts: true,
          savePrompts: false,
          modifyPrompts: false,
          createPrompts: false,
          createSequences: false,
          unlimitedUsage: false
        };
    }
  }

  /**
   * Check if a specific feature is accessible
   */
  canAccess(feature: keyof FeatureAccess): boolean {
    const access = this.getFeatureAccess();
    return access[feature];
  }

  /**
   * Get appropriate upgrade message for locked feature
   */
  getUpgradeMessage(feature: keyof FeatureAccess): string {
    if (!this.userState.isSignedIn) {
      if (feature === 'savePrompts') {
        return 'Sign up to save your favorite prompts';
      }
      return 'Sign up for free to unlock this feature';
    }

    // User is signed in but may need a subscription for premium limits
    const messages: Record<string, string> = {
      modifyPrompts: 'Upgrade to Pro to increase your daily modification limit',
      createPrompts: 'Upgrade to Pro to increase your daily creation limit',
      createSequences: 'Upgrade to Pro to access advanced sequence features',
      unlimitedUsage: 'Upgrade to Pro for unlimited usage'
    };

    return messages[feature] || 'Upgrade to access this feature';
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Send message to background script to handle OAuth
      chrome.runtime.sendMessage({ type: 'GOOGLE_SIGN_IN' }, async (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || 'Sign in failed'));
          return;
        }
        
        if (!response || !response.success) {
          reject(new Error(response?.error || 'Sign in failed'));
          return;
        }

        try {
          // Update user state with the returned user info
          this.userState = {
            isSignedIn: true,
            tier: 'free',
            email: response.user.email,
            userId: response.user.email, // Use email as ID for simplicity
            hasApiKey: this.userState.hasApiKey,
            dailyModificationsUsed: 0,
            lastResetDate: new Date().toISOString().split('T')[0]
          };

          // Save to storage
          await chrome.storage.local.set({ 
            user: response.user,
            dailyUsage: {
              date: this.userState.lastResetDate,
              count: 0
            }
          });
          
          // Setup subscription sync for the signed-in user
          if (this.userState.userId) {
            subscriptionSyncService.setupAutoSync(this.userState.userId).catch(error => {
              console.error('Failed to setup subscription sync:', error);
            });
          }
          
          this.notifyListeners();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    return new Promise((resolve) => {
      // Send message to background script to handle sign out
      chrome.runtime.sendMessage({ type: 'GOOGLE_SIGN_OUT' }, () => {
        // Reset user state
        this.userState = {
          isSignedIn: false,
          tier: 'anonymous',
          hasApiKey: false,
          dailyModificationsUsed: 0,
          lastResetDate: new Date().toISOString().split('T')[0]
        };

        // Clear from storage
        chrome.storage.local.remove(['user', 'dailyUsage'], () => {
          this.notifyListeners();
          resolve();
        });
      });
    });
  }

  /**
   * Upgrade to paid subscription
   */
  async upgradeToPaid(subscriptionData: any): Promise<void> {
    this.userState.tier = 'paid';
    this.userState.subscription = {
      status: 'active',
      plan: subscriptionData.plan || 'pro',
      expiresAt: subscriptionData.expiresAt
    };
    
    await chrome.storage.local.set({ subscription: this.userState.subscription });
    this.notifyListeners();
  }

  /**
   * Subscribe to user state changes
   */
  subscribe(callback: (state: UserState) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners() {
    const state = this.getUserState();
    this.listeners.forEach(callback => callback(state));
  }

  /**
   * Track a modification usage
   */
  async trackModification(): Promise<boolean> {
    // Check if it's a new day and reset if needed
    const today = new Date().toISOString().split('T')[0];
    if (this.userState.lastResetDate !== today) {
      this.userState.dailyModificationsUsed = 0;
      this.userState.lastResetDate = today;
    }
    
    // Paid users have unlimited usage
    if (this.userState.tier === 'paid') {
      return true;
    }
    
    // Check if user has remaining modifications
    if (this.userState.dailyModificationsUsed >= this.DAILY_FREE_MODIFICATIONS) {
      return false;
    }
    
    // Increment usage
    this.userState.dailyModificationsUsed++;
    await this.saveDailyUsage();
    this.notifyListeners();
    
    return true;
  }
  
  /**
   * Get remaining modifications for today
   */
  getRemainingModifications(): number {
    if (this.userState.tier === 'paid') {
      return -1; // Unlimited
    }
    
    // Check if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (this.userState.lastResetDate !== today) {
      return this.DAILY_FREE_MODIFICATIONS;
    }
    
    return Math.max(0, this.DAILY_FREE_MODIFICATIONS - this.userState.dailyModificationsUsed);
  }

  /**
   * Check if user needs to upgrade
   */
  needsUpgrade(): boolean {
    return this.userState.tier === 'free' && 
           this.userState.dailyModificationsUsed >= this.DAILY_FREE_MODIFICATIONS;
  }

  /**
   * Check for ExtPay payment updates (called periodically)
   */
  private async syncExtPayStatus(): Promise<void> {
    if (!this.userState.isSignedIn || this.userState.tier === 'paid') {
      return; // Skip if not signed in or already paid
    }

    try {
      const paymentStatus = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_PAYMENT_STATUS' }, (response) => {
          resolve(response || { paid: false });
        });
      });
      
      if (paymentStatus.paid && this.userState.tier !== 'paid') {
        console.log('🎉 New payment detected! Upgrading user to Pro...');
        
        this.userState.tier = 'paid';
        this.userState.subscription = {
          status: 'active',
          plan: 'pro',
          expiresAt: paymentStatus.paidAt ? 
            new Date(new Date(paymentStatus.paidAt).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() :
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        // Save to storage
        await chrome.storage.local.set({ 
          subscription: this.userState.subscription
        });
        
        this.notifyListeners();
        console.log('✅ User automatically upgraded to Pro!');
      }
    } catch (error) {
      console.error('Failed to sync ExtPay status:', error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Expose for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__authService = authService;
}

export default authService;
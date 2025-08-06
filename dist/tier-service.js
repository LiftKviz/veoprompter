// User Tier Management Service
// Handles Free, BYOK, and Paid tier logic

class TierService {
  constructor() {
    this.tiers = {
      FREE: 'free',
      BYOK: 'byok', 
      PAID: 'paid'
    };
    
    this.tierFeatures = {
      free: {
        canBrowsePrompts: true,
        canCopyPrompts: true,
        canModifyPrompts: false,
        canSavePrompts: false,
        canSyncData: false,
        maxPersonalPrompts: 0
      },
      byok: {
        canBrowsePrompts: true,
        canCopyPrompts: true,
        canModifyPrompts: true,
        canSavePrompts: true,
        canSyncData: true,
        maxPersonalPrompts: -1, // unlimited
        requiresApiKey: true
      },
      paid: {
        canBrowsePrompts: true,
        canCopyPrompts: true,
        canModifyPrompts: true,
        canSavePrompts: true,
        canSyncData: true,
        maxPersonalPrompts: -1, // unlimited
        requiresApiKey: false,
        price: 4.99
      }
    };
    
    this.currentUser = null;
    this.init();
  }

  static getInstance() {
    if (!TierService.instance) {
      TierService.instance = new TierService();
    }
    return TierService.instance;
  }

  async init() {
    await this.loadUserTier();
    this.setupEventListeners();
  }

  // Load user's current tier from storage
  async loadUserTier() {
    try {
      const result = await chrome.storage.sync.get(['userTier', 'userApiKey']);
      
      this.currentUser = {
        tier: result.userTier || this.tiers.FREE,
        apiKey: result.userApiKey || null,
        subscriptionStatus: 'inactive', // Will be updated when Stripe is integrated
        tierActivatedAt: new Date().toISOString(),
        features: this.tierFeatures[result.userTier || this.tiers.FREE]
      };
      
      console.log('User tier loaded:', this.currentUser.tier);
      this.notifyTierChange();
      
    } catch (error) {
      console.error('Failed to load user tier:', error);
      // Default to free tier
      this.currentUser = {
        tier: this.tiers.FREE,
        apiKey: null,
        subscriptionStatus: 'inactive',
        tierActivatedAt: new Date().toISOString(),
        features: this.tierFeatures[this.tiers.FREE]
      };
    }
  }

  // Get current user tier info
  getCurrentTier() {
    return this.currentUser?.tier || this.tiers.FREE;
  }

  // Get current user's features
  getFeatures() {
    return this.currentUser?.features || this.tierFeatures[this.tiers.FREE];
  }

  // Check if user can perform specific action
  canPerformAction(action) {
    const features = this.getFeatures();
    return features[action] || false;
  }

  // Upgrade to BYOK tier
  async upgradeToBYOK(apiKey) {
    if (!apiKey?.trim()) {
      throw new Error('Valid OpenAI API key is required for BYOK tier');
    }

    // Validate API key
    const isValid = await this.validateApiKey(apiKey);
    if (!isValid) {
      throw new Error('Invalid OpenAI API key. Please check your key and try again.');
    }

    // Update user tier
    await this.setUserTier(this.tiers.BYOK, apiKey);
    
    console.log('User upgraded to BYOK tier');
    return true;
  }

  // Upgrade to Paid tier (placeholder for Stripe integration)
  async upgradeToPaid() {
    // For now, just show coming soon message
    // This will be replaced with Stripe checkout when payment is integrated
    
    throw new Error('💳 Paid tier coming soon! For now, you can use BYOK tier with your own OpenAI API key.');
  }

  // Downgrade to Free tier
  async downgradeToFree() {
    await this.setUserTier(this.tiers.FREE, null);
    console.log('User downgraded to Free tier');
    return true;
  }

  // Set user tier and save to storage
  async setUserTier(tier, apiKey = null) {
    this.currentUser = {
      tier: tier,
      apiKey: apiKey,
      subscriptionStatus: tier === this.tiers.PAID ? 'active' : 'inactive',
      tierActivatedAt: new Date().toISOString(),
      features: this.tierFeatures[tier]
    };

    // Save to storage
    await chrome.storage.sync.set({
      userTier: tier,
      userApiKey: apiKey
    });

    this.notifyTierChange();
  }

  // Validate OpenAI API key
  async validateApiKey(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Check if GPT-4o is available
        const hasGPT4o = data.data.some(model => model.id.includes('gpt-4o'));
        if (!hasGPT4o) {
          console.warn('API key valid but GPT-4o not available');
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  // Get API key to use (user's key for BYOK, system key for paid)
  getApiKeyToUse() {
    const tier = this.getCurrentTier();
    
    if (tier === this.tiers.BYOK) {
      return this.currentUser?.apiKey;
    }
    
    if (tier === this.tiers.PAID) {
      // This will return your system API key when paid tier is implemented
      return null; // For now, paid tier is not available
    }
    
    return null; // Free tier has no API access
  }

  // Check if user can modify prompts
  canModifyPrompts() {
    const features = this.getFeatures();
    if (!features.canModifyPrompts) {
      return false;
    }

    // For BYOK, also check if they have a valid API key
    if (this.getCurrentTier() === this.tiers.BYOK) {
      return !!this.currentUser?.apiKey;
    }

    return true;
  }

  // Get tier upgrade suggestions
  getUpgradeSuggestions() {
    const currentTier = this.getCurrentTier();
    
    const suggestions = [];
    
    if (currentTier === this.tiers.FREE) {
      suggestions.push({
        tier: this.tiers.BYOK,
        title: '🔑 Upgrade to BYOK',
        description: 'Bring your own OpenAI API key for full features',
        action: 'Add your API key to unlock AI-powered prompt modifications',
        buttonText: 'Add API Key'
      });
      
      suggestions.push({
        tier: this.tiers.PAID,
        title: '💳 Upgrade to Premium',
        description: 'Full features with API costs covered',
        price: '$4.99/month',
        action: 'coming-soon',
        buttonText: 'Coming Soon'
      });
    }
    
    if (currentTier === this.tiers.BYOK) {
      suggestions.push({
        tier: this.tiers.PAID,
        title: '💳 Upgrade to Premium', 
        description: 'Let us handle API costs for ultimate convenience',
        price: '$4.99/month',
        action: 'coming-soon',
        buttonText: 'Coming Soon'
      });
    }
    
    return suggestions;
  }

  // Get tier status for display
  getTierStatus() {
    const tier = this.getCurrentTier();
    const features = this.getFeatures();
    
    const status = {
      tier: tier,
      displayName: this.getTierDisplayName(tier),
      features: features,
      canUpgrade: tier !== this.tiers.PAID,
      suggestions: this.getUpgradeSuggestions()
    };

    // Add specific status info
    if (tier === this.tiers.BYOK) {
      status.hasApiKey = !!this.currentUser?.apiKey;
      status.apiKeyStatus = status.hasApiKey ? 'connected' : 'required';
    }

    if (tier === this.tiers.PAID) {
      status.subscriptionStatus = this.currentUser?.subscriptionStatus || 'inactive';
      status.price = '$4.99/month';
    }

    return status;
  }

  // Get user-friendly tier name
  getTierDisplayName(tier) {
    const names = {
      [this.tiers.FREE]: 'Free',
      [this.tiers.BYOK]: 'BYOK (Bring Your Own Key)', 
      [this.tiers.PAID]: 'Premium'
    };
    return names[tier] || 'Unknown';
  }

  // Setup event listeners
  setupEventListeners() {
    // Listen for storage changes (multi-tab sync)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && (changes.userTier || changes.userApiKey)) {
        this.loadUserTier();
      }
    });
  }

  // Notify other parts of the extension about tier changes
  notifyTierChange() {
    // Dispatch custom event
    const event = new CustomEvent('tierChanged', {
      detail: {
        tier: this.getCurrentTier(),
        features: this.getFeatures(),
        status: this.getTierStatus()
      }
    });
    
    document.dispatchEvent(event);
    
    // Update UI elements if they exist
    this.updateTierDisplays();
  }

  // Update tier displays throughout the UI
  updateTierDisplays() {
    const status = this.getTierStatus();
    
    // Update tier badge if it exists
    const tierBadge = document.querySelector('.tier-badge');
    if (tierBadge) {
      tierBadge.textContent = status.displayName;
      tierBadge.className = `tier-badge tier-${status.tier}`;
    }

    // Update feature access indicators
    const modifyButtons = document.querySelectorAll('.modify-prompt-btn');
    modifyButtons.forEach(btn => {
      if (this.canModifyPrompts()) {
        btn.disabled = false;
        btn.title = 'Modify this prompt with AI';
      } else {
        btn.disabled = true;
        btn.title = 'Upgrade to modify prompts with AI';
      }
    });
  }

  // Export user tier data
  exportTierData() {
    return {
      tier: this.getCurrentTier(),
      features: this.getFeatures(),
      status: this.getTierStatus(),
      activatedAt: this.currentUser?.tierActivatedAt,
      hasApiKey: !!this.currentUser?.apiKey,
      exportedAt: new Date().toISOString()
    };
  }
}

// Create global instance
window.tierService = TierService.getInstance();

// Helper functions for easy access
window.canModifyPrompts = () => window.tierService.canModifyPrompts();
window.getCurrentTier = () => window.tierService.getCurrentTier();
window.getTierFeatures = () => window.tierService.getFeatures();

console.log('🎯 TierService initialized');
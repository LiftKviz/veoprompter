// User Data Service - Manages personal prompts, preferences, and sync

class UserDataService {
  constructor() {
    this.currentUser = null;
    this.userPrompts = [];
    this.userPreferences = {
      theme: 'light',
      defaultCategory: 'all',
      favoriteCategories: [],
      lastUsedPrompts: []
    };
    this.analytics = {
      promptsCreated: 0,
      promptsModified: 0,
      promptsCopied: 0,
      totalUsage: 0,
      lastActive: null
    };
    
    this.init();
  }

  init() {
    // Listen for auth state changes
    if (window.authModule) {
      window.authModule.onAuthStateChange((user) => {
        this.currentUser = user;
        if (user) {
          this.loadUserData();
        } else {
          this.clearUserData();
        }
      });
    }
  }

  // Load all user data from Chrome storage
  async loadUserData() {
    if (!this.currentUser) return;
    
    const userId = this.currentUser.id;
    
    try {
      const result = await chrome.storage.sync.get([
        `prompts_${userId}`,
        `preferences_${userId}`,
        `analytics_${userId}`
      ]);
      
      this.userPrompts = result[`prompts_${userId}`] || [];
      this.userPreferences = result[`preferences_${userId}`] || this.userPreferences;
      this.analytics = result[`analytics_${userId}`] || this.analytics;
      
      console.log('User data loaded:', {
        prompts: this.userPrompts.length,
        preferences: this.userPreferences,
        analytics: this.analytics
      });
      
      // Update last active
      this.updateAnalytics('lastActive', new Date().toISOString());
      
      // Dispatch event for UI updates
      this.notifyDataLoaded();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  // Clear user data on sign out
  clearUserData() {
    this.userPrompts = [];
    this.userPreferences = {
      theme: 'light',
      defaultCategory: 'all',
      favoriteCategories: [],
      lastUsedPrompts: []
    };
    this.analytics = {
      promptsCreated: 0,
      promptsModified: 0,
      promptsCopied: 0,
      totalUsage: 0,
      lastActive: null
    };
    
    this.notifyDataLoaded();
  }

  // Save a prompt to user's personal library
  async savePrompt(prompt) {
    if (!this.currentUser) {
      alert('Please sign in to save prompts');
      return false;
    }
    
    // Check tier permissions
    const tierService = window.tierService;
    if (tierService && !tierService.canPerformAction('canSavePrompts')) {
      const currentTier = tierService.getCurrentTier();
      if (currentTier === 'free') {
        alert('🔒 Upgrade Required: Saving prompts is available with BYOK or Premium plans. Click settings to upgrade.');
        return false;
      }
    }
    
    const userId = this.currentUser.id;
    
    // Add metadata
    const userPrompt = {
      ...prompt,
      id: prompt.id || `prompt_${Date.now()}`,
      userId: userId,
      savedAt: new Date().toISOString(),
      savedBy: this.currentUser.email,
      isPersonal: true
    };
    
    // Check if already exists
    const existingIndex = this.userPrompts.findIndex(p => p.id === userPrompt.id);
    if (existingIndex >= 0) {
      this.userPrompts[existingIndex] = userPrompt;
    } else {
      this.userPrompts.push(userPrompt);
    }
    
    // Save to Chrome sync storage (cross-device sync)
    try {
      await chrome.storage.sync.set({
        [`prompts_${userId}`]: this.userPrompts
      });
      
      // Update analytics
      this.updateAnalytics('promptsCreated', this.analytics.promptsCreated + 1);
      
      console.log('Prompt saved:', userPrompt);
      this.notifyPromptSaved(userPrompt);
      return true;
    } catch (error) {
      console.error('Error saving prompt:', error);
      if (error.message && error.message.includes('QUOTA_BYTES')) {
        alert('Storage quota exceeded. Please delete some old prompts.');
      }
      return false;
    }
  }

  // Delete a prompt from user's library
  async deletePrompt(promptId) {
    if (!this.currentUser) return false;
    
    const userId = this.currentUser.id;
    this.userPrompts = this.userPrompts.filter(p => p.id !== promptId);
    
    try {
      await chrome.storage.sync.set({
        [`prompts_${userId}`]: this.userPrompts
      });
      
      this.notifyPromptDeleted(promptId);
      return true;
    } catch (error) {
      console.error('Error deleting prompt:', error);
      return false;
    }
  }

  // Get user's saved prompts
  getUserPrompts() {
    return this.userPrompts;
  }

  // Update user preferences
  async updatePreferences(preferences) {
    if (!this.currentUser) return false;
    
    const userId = this.currentUser.id;
    this.userPreferences = { ...this.userPreferences, ...preferences };
    
    try {
      await chrome.storage.sync.set({
        [`preferences_${userId}`]: this.userPreferences
      });
      
      this.notifyPreferencesUpdated();
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }

  // Get user preferences
  getPreferences() {
    return this.userPreferences;
  }

  // Update analytics
  async updateAnalytics(key, value) {
    if (!this.currentUser) return;
    
    const userId = this.currentUser.id;
    this.analytics[key] = value;
    this.analytics.totalUsage = (this.analytics.totalUsage || 0) + 1;
    
    try {
      await chrome.storage.sync.set({
        [`analytics_${userId}`]: this.analytics
      });
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  // Track prompt usage
  trackPromptUsage(action, promptId) {
    switch (action) {
      case 'copy':
        this.updateAnalytics('promptsCopied', (this.analytics.promptsCopied || 0) + 1);
        break;
      case 'modify':
        this.updateAnalytics('promptsModified', (this.analytics.promptsModified || 0) + 1);
        break;
    }
    
    // Track last used prompts
    const lastUsed = this.userPreferences.lastUsedPrompts || [];
    const updated = [promptId, ...lastUsed.filter(id => id !== promptId)].slice(0, 5);
    this.updatePreferences({ lastUsedPrompts: updated });
  }

  // Event notifications
  notifyDataLoaded() {
    window.dispatchEvent(new CustomEvent('userDataLoaded', { 
      detail: { 
        prompts: this.userPrompts,
        preferences: this.userPreferences,
        user: this.currentUser
      } 
    }));
  }

  notifyPromptSaved(prompt) {
    window.dispatchEvent(new CustomEvent('promptSaved', { detail: prompt }));
  }

  notifyPromptDeleted(promptId) {
    window.dispatchEvent(new CustomEvent('promptDeleted', { detail: promptId }));
  }

  notifyPreferencesUpdated() {
    window.dispatchEvent(new CustomEvent('preferencesUpdated', { 
      detail: this.userPreferences 
    }));
  }

  // Export user data (for backup)
  exportUserData() {
    return {
      user: {
        email: this.currentUser?.email,
        name: this.currentUser?.name
      },
      prompts: this.userPrompts,
      preferences: this.userPreferences,
      analytics: this.analytics,
      exportedAt: new Date().toISOString()
    };
  }

  // Import user data (restore from backup)
  async importUserData(data) {
    if (!this.currentUser) {
      alert('Please sign in to import data');
      return false;
    }
    
    try {
      if (data.prompts) {
        this.userPrompts = data.prompts;
        await chrome.storage.sync.set({
          [`prompts_${this.currentUser.id}`]: this.userPrompts
        });
      }
      
      if (data.preferences) {
        await this.updatePreferences(data.preferences);
      }
      
      this.notifyDataLoaded();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

// Create global instance
window.userDataService = new UserDataService();

// Helper functions for easy access
window.saveUserPrompt = (prompt) => window.userDataService.savePrompt(prompt);
window.getUserPrompts = () => window.userDataService.getUserPrompts();
window.updateUserPreferences = (prefs) => window.userDataService.updatePreferences(prefs);
window.getUserPreferences = () => window.userDataService.getPreferences();
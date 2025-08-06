// Enhanced GPT Service with Cost Tracking and Token Management

class EnhancedGPTService {
  constructor() {
    this.apiKey = null;
    this.useCache = false;
    this.maxOutputTokens = 800;
    this.batchMode = false;
    this.secureStorage = new SecureStorage();
    this.systemPrompt = `You are an expert AI prompt engineer specializing in Google Veo 3. Transform ideas into prompts using the SSASA framework:

1) SUBJECT: Clearly identify who/what is the focus with specific details (e.g., 'grizzled detective in rumpled trench coat' not 'a man')
2) SCENE: Describe environment in detail - where and when action occurs (e.g., 'dusty attic with afternoon light through grimy window')
3) ACTION: Define what subject is doing with strong verbs, chain actions with 'this happens, then that happens'
4) STYLE: Specify visual aesthetic (e.g., '1990s VHS footage', '8-bit video game', 'claymation', 'filmed on 16mm')
5) AUDIO: Explicitly describe all sounds - dialogue, ambient sounds, SFX, and music (Veo 3's signature feature)

For dialogue, use format: "Character Name says (with emotional tone): 'Exact words.'" - This prevents mixing up speakers.

Include negative prompt (no subtitles, no on-screen text) unless requested. Keep modifications concise and focused on the user's instruction while maintaining Veo 3 best practices.`;
  }

  static getInstance() {
    if (!EnhancedGPTService.instance) {
      EnhancedGPTService.instance = new EnhancedGPTService();
    }
    return EnhancedGPTService.instance;
  }

  async getApiKey() {
    // Use tier service to get the appropriate API key
    const tierService = window.tierService;
    if (tierService) {
      const apiKey = tierService.getApiKeyToUse();
      if (apiKey) {
        return apiKey;
      }
    }
    
    // Use secure storage for API key
    if (this.apiKey) return this.apiKey;
    
    try {
      // Try to migrate old unencrypted key first
      await this.secureStorage.migrateOldKey();
      
      // Get encrypted API key
      this.apiKey = await this.secureStorage.getApiKey();
      return this.apiKey;
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      this.apiKey = null;
      return null;
    }
  }

  // Set optimization settings
  setOptimizations(options) {
    this.useCache = options.useCache || false;
    this.maxOutputTokens = options.maxOutputTokens || 800;
    this.batchMode = options.batchMode || false;
  }

  // Enhanced modify prompt with cost tracking
  async modifyPrompt(request) {
    const startTime = Date.now();
    const tierService = window.tierService;
    const userId = window.authModule?.getCurrentUser()?.id;
    
    // Check if user can modify prompts based on their tier
    if (tierService && !tierService.canModifyPrompts()) {
      const currentTier = tierService.getCurrentTier();
      const tierName = tierService.getTierDisplayName(currentTier);
      
      if (currentTier === 'free') {
        throw new Error('🔒 Upgrade Required: AI prompt modifications are available with BYOK or Premium plans. Click settings to upgrade.');
      } else if (currentTier === 'byok') {
        throw new Error('🔑 API Key Required: Please add your OpenAI API key in settings to use AI modifications.');
      } else {
        throw new Error('❌ Feature not available on your current plan.');
      }
    }
    
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('🔑 API key required: Please add your OpenAI API key in settings to use prompt modification features.');
    }

    if (!request.instruction?.trim()) {
      throw new Error('📝 Modification instruction required: Please describe how you want to modify the prompt.');
    }

    const userContent = `Original prompt: "${request.prompt}"

Modification instruction: "${request.instruction}"

Please modify the prompt according to the instruction using the SSASA framework.`;

    // Build messages array
    const messages = [
      {
        role: 'system',
        content: this.systemPrompt
      },
      {
        role: 'user',
        content: userContent
      }
    ];

    try {
      // Make API call with cost tracking
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-08-06',
          messages: messages,
          max_tokens: this.maxOutputTokens,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = this.getErrorMessage(response.status, errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const modifiedPrompt = data.choices?.[0]?.message?.content?.trim();

      if (!modifiedPrompt) {
        throw new Error('🤖 AI response was empty. Please try again with a different instruction.');
      }

      // Track the API call cost
      const usage = data.usage || {};
      const costData = this.trackApiCall({
        prompt: request.prompt,
        instruction: request.instruction,
        response: modifiedPrompt,
        usage: usage,
        userId: userId,
        responseTime: Date.now() - startTime
      });

      // Cost tracking for admin only - no user notification

      return {
        modifiedPrompt,
        originalPrompt: request.prompt,
        instruction: request.instruction,
        // costData and usage removed from user response - tracked internally only
        success: true
      };

    } catch (error) {
      console.error('GPT API Error:', error);
      throw error;
    }
  }

  // Track API call with precise token counts
  trackApiCall(data) {
    const { prompt, instruction, response, usage, userId, responseTime } = data;
    
    // Use actual usage from OpenAI if available, otherwise estimate
    const inputTokens = usage.prompt_tokens || window.costCalculator.countTokens(this.systemPrompt + prompt + instruction);
    const outputTokens = usage.completion_tokens || window.costCalculator.countTokens(response);
    
    // Calculate precise cost
    const inputCost = inputTokens * (this.useCache ? 1.25 / 1000000 : 2.50 / 1000000);
    const outputCost = outputTokens * (10.00 / 1000000);
    const totalCost = inputCost + outputCost;
    
    // Track in cost calculator
    const costData = {
      inputTokens,
      outputTokens,
      totalCost,
      inputCost,
      outputCost,
      responseTime,
      cached: this.useCache,
      userId
    };

    // Update analytics
    if (window.costCalculator) {
      window.costCalculator.trackApiCall(prompt, instruction, response, userId);
    }

    // Update user analytics
    if (window.userDataService && userId) {
      window.userDataService.updateAnalytics('promptsModified', 
        (window.userDataService.analytics.promptsModified || 0) + 1);
      window.userDataService.updateAnalytics('totalApiCost', 
        (window.userDataService.analytics.totalApiCost || 0) + totalCost);
    }

    return costData;
  }

  // Show cost notification
  showCostNotification(costData) {
    // Only show if user has enabled cost notifications
    const preferences = window.userDataService?.getPreferences() || {};
    if (!preferences.showCostNotifications) return;

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: #4CAF50;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
      💰 API Cost: $${costData.totalCost.toFixed(6)}<br>
      📊 ${costData.inputTokens}↑ + ${costData.outputTokens}↓ tokens<br>
      ⚡ ${costData.responseTime}ms
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Get error message based on status code
  getErrorMessage(status, errorData) {
    const defaultMessage = errorData?.error?.message || 'API request failed';
    
    switch (status) {
      case 401:
        return '🔑 Invalid API key. Please check your OpenAI API key in settings.';
      case 403:
        return '🚫 API key lacks required permissions. Please check your OpenAI account.';
      case 429:
        return '⏳ Rate limit exceeded. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
        return '🛠️ OpenAI API is temporarily unavailable. Please try again in a few moments.';
      default:
        return `❌ API Error (${status}): ${defaultMessage}`;
    }
  }

  // Batch process multiple prompts (cost optimization)
  async batchModifyPrompts(requests) {
    if (!this.batchMode || requests.length === 1) {
      // Process individually
      const results = [];
      for (const request of requests) {
        try {
          const result = await this.modifyPrompt(request);
          results.push({ success: true, data: result });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
      return results;
    }

    // Batch processing (experimental)
    // This would require restructuring the prompt to handle multiple modifications
    // For now, fallback to individual processing
    return this.batchModifyPrompts(requests.map(r => ({ ...r, batch: false })));
  }

  // Get usage statistics
  getUsageStats() {
    return window.costCalculator?.getUsageStats() || null;
  }

  // Export usage data
  exportUsageData() {
    const stats = this.getUsageStats();
    if (!stats) return null;

    const data = {
      service: 'Enhanced GPT Service',
      period: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      },
      usage: stats,
      settings: {
        useCache: this.useCache,
        maxOutputTokens: this.maxOutputTokens,
        batchMode: this.batchMode
      },
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gpt-service-usage-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Test API key and return info
  async testApiKey(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`API key test failed: ${response.status}`);
      }

      const data = await response.json();
      const gpt4Models = data.data.filter(model => model.id.includes('gpt-4'));
      
      return {
        valid: true,
        models: gpt4Models.length,
        hasGPT4o: gpt4Models.some(m => m.id.includes('gpt-4o')),
        organization: response.headers.get('openai-organization') || 'default'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

// Create global instance and integrate with existing code
window.enhancedGPTService = EnhancedGPTService.getInstance();

// Override the existing GPT service if it exists
if (window.GPTService) {
  window.GPTService.getInstance = () => window.enhancedGPTService;
}
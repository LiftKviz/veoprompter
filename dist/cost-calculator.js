// GPT-4o Cost Calculator and Usage Tracker

class CostCalculator {
  constructor() {
    this.pricing = {
      gpt4o: {
        input: 2.50 / 1000000,      // $2.50 per 1M tokens
        output: 10.00 / 1000000,    // $10.00 per 1M tokens
        cached: 1.25 / 1000000      // $1.25 per 1M tokens (cached input)
      }
    };
    
    this.systemPromptTokens = 850; // Your SSASA framework prompt
    this.avgUserInputTokens = 200;
    this.avgOutputTokens = 350;
    
    this.dailyUsage = {
      totalCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      byUser: {},
      byHour: new Array(24).fill(0)
    };
    
    this.monthlyUsage = {
      totalCalls: 0,
      totalCost: 0,
      byDay: new Array(31).fill(0),
      topUsers: []
    };
    
    this.init();
  }

  init() {
    // Load existing usage data
    this.loadUsageData();
    
    // Set up periodic saves
    setInterval(() => this.saveUsageData(), 30000); // Save every 30 seconds
    
    // Reset daily stats at midnight
    this.scheduleResets();
    
    // Create calculator UI
    this.createCalculatorUI();
  }

  // Accurate token counting (approximation - for exact counts you need tiktoken)
  countTokens(text) {
    // Rough approximation: 1 token ≈ 4 characters for English
    // This is conservative - actual might be slightly less
    return Math.ceil(text.length / 3.5);
  }

  // Calculate cost for a single API call
  calculateCallCost(inputTokens, outputTokens, useCache = false) {
    const inputCost = inputTokens * (useCache ? this.pricing.gpt4o.cached : this.pricing.gpt4o.input);
    const outputCost = outputTokens * this.pricing.gpt4o.output;
    return inputCost + outputCost;
  }

  // Track a single API call
  trackApiCall(prompt, instruction, response, userId = null) {
    const systemTokens = this.systemPromptTokens;
    const userTokens = this.countTokens(`Original prompt: "${prompt}"\nModification instruction: "${instruction}"\nPlease modify the prompt according to the instruction using the SSASA framework.`);
    const outputTokens = this.countTokens(response);
    
    const totalInputTokens = systemTokens + userTokens;
    const cost = this.calculateCallCost(totalInputTokens, outputTokens);
    
    // Update daily stats
    this.dailyUsage.totalCalls++;
    this.dailyUsage.totalInputTokens += totalInputTokens;
    this.dailyUsage.totalOutputTokens += outputTokens;
    this.dailyUsage.totalCost += cost;
    this.dailyUsage.byHour[new Date().getHours()]++;
    
    // Track by user
    if (userId) {
      if (!this.dailyUsage.byUser[userId]) {
        this.dailyUsage.byUser[userId] = {
          calls: 0,
          cost: 0,
          inputTokens: 0,
          outputTokens: 0
        };
      }
      this.dailyUsage.byUser[userId].calls++;
      this.dailyUsage.byUser[userId].cost += cost;
      this.dailyUsage.byUser[userId].inputTokens += totalInputTokens;
      this.dailyUsage.byUser[userId].outputTokens += outputTokens;
    }
    
    // Update monthly stats
    this.monthlyUsage.totalCalls++;
    this.monthlyUsage.totalCost += cost;
    this.monthlyUsage.byDay[new Date().getDate() - 1] += cost;
    
    console.log('API Call Tracked:', {
      inputTokens: totalInputTokens,
      outputTokens,
      cost: cost.toFixed(6),
      userId
    });
    
    // Update UI if visible
    this.updateUsageUI();
    
    return {
      inputTokens: totalInputTokens,
      outputTokens,
      cost,
      breakdown: {
        systemPrompt: systemTokens,
        userInput: userTokens,
        response: outputTokens
      }
    };
  }

  // Get current usage stats
  getUsageStats() {
    const now = new Date();
    const today = now.getDate();
    
    return {
      today: {
        calls: this.dailyUsage.totalCalls,
        cost: this.dailyUsage.totalCost,
        avgCostPerCall: this.dailyUsage.totalCalls > 0 ? this.dailyUsage.totalCost / this.dailyUsage.totalCalls : 0,
        peakHour: this.dailyUsage.byHour.indexOf(Math.max(...this.dailyUsage.byHour))
      },
      thisMonth: {
        calls: this.monthlyUsage.totalCalls,
        cost: this.monthlyUsage.totalCost,
        avgCostPerCall: this.monthlyUsage.totalCalls > 0 ? this.monthlyUsage.totalCost / this.monthlyUsage.totalCalls : 0,
        projectedMonthlyCost: (this.monthlyUsage.totalCost / today) * 30
      },
      breakdownByUser: Object.entries(this.dailyUsage.byUser)
        .sort(([,a], [,b]) => b.cost - a.cost)
        .slice(0, 10),
      hourlyDistribution: this.dailyUsage.byHour
    };
  }

  // Calculate pricing scenarios
  calculatePricingScenarios(userCount, avgModsPerUserPerDay) {
    const dailyMods = userCount * avgModsPerUserPerDay;
    const monthlyCost = dailyMods * 30 * 0.006; // Average cost per mod
    
    return {
      scenario: {
        users: userCount,
        modsPerUserPerDay: avgModsPerUserPerDay,
        totalDailyMods: dailyMods,
        monthlyApiCost: monthlyCost
      },
      breakeven: {
        premiumUsersNeeded: Math.ceil(monthlyCost / 4.99),
        conversionRateNeeded: Math.ceil(monthlyCost / 4.99) / userCount,
        byokReduction50: Math.ceil((monthlyCost * 0.5) / 4.99)
      },
      profitability: {
        with10PercentPremium: (userCount * 0.1 * 4.99) - monthlyCost,
        with20PercentPremium: (userCount * 0.2 * 4.99) - monthlyCost,
        with50PercentBYOK: (userCount * 0.1 * 4.99) - (monthlyCost * 0.5)
      }
    };
  }

  // Create calculator UI
  createCalculatorUI() {
    // Add to settings modal when it appears
    document.addEventListener('DOMContentLoaded', () => {
      this.injectCalculatorUI();
    });
  }

  injectCalculatorUI() {
    // Watch for settings modal
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.id === 'settings-modal' || (node.querySelector && node.querySelector('#settings-modal'))) {
            setTimeout(() => this.addCalculatorToSettings(), 100);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  addCalculatorToSettings() {
    const settingsContent = document.querySelector('.settings-content');
    if (!settingsContent || settingsContent.querySelector('#usage-tracker')) return;

    const usageSection = document.createElement('div');
    usageSection.id = 'usage-tracker';
    usageSection.innerHTML = `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <h3 style="font-size: 16px; margin-bottom: 12px;">📊 Usage Statistics</h3>
        
        <div id="usage-stats" style="
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 13px;
        ">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <strong>Today:</strong><br>
              <span id="today-calls">0</span> modifications
            </div>
            <div>
              <strong>This Month:</strong><br>
              <span id="month-calls">0</span> modifications
            </div>
          </div>
          <div style="margin-top: 8px; font-size: 12px; color: #666;">
            Most active hour: <span id="peak-hour">--</span>:00
          </div>
        </div>

        <div style="margin-top: 16px;">
          <h4 style="font-size: 14px; margin-bottom: 8px;">⚡ Performance Settings</h4>
          <div style="font-size: 12px; line-height: 1.6;">
            <label style="display: flex; align-items: center; margin-bottom: 4px;">
              <input type="checkbox" id="enable-caching" style="margin-right: 8px;">
              Enable response caching (faster responses)
            </label>
            <label style="display: flex; align-items: center; margin-bottom: 4px;">
              <input type="checkbox" id="limit-output" style="margin-right: 8px;">
              Limit response length (concise outputs)
            </label>
            <label style="display: flex; align-items: center;">
              <input type="checkbox" id="batch-processing" style="margin-right: 8px;">
              Enable batch processing (bulk operations)
            </label>
          </div>
        </div>

        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
          <button id="export-usage-data" style="
            background: #4285f4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
          ">
            📥 Export My Usage Data
          </button>
        </div>
      </div>
    `;

    settingsContent.appendChild(usageSection);
    this.attachUsageListeners();
    this.updateUsageUI();
  }

  attachUsageListeners() {
    // Export user's usage data (without cost details)
    const exportBtn = document.getElementById('export-usage-data');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const userId = window.authModule?.getCurrentUser()?.id;
        const userStats = this.getUserStats(userId);
        
        const data = {
          userId: userId,
          period: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          },
          usage: {
            today: {
              modifications: userStats.today.calls,
              peakHour: userStats.today.peakHour
            },
            thisMonth: {
              modifications: userStats.thisMonth.calls,
              averagePerDay: userStats.thisMonth.avgPerDay
            }
          },
          preferences: window.userDataService?.getPreferences() || {},
          exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-veo3-usage-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      };
    }

    // Performance settings (these actually affect the GPT service)
    const cachingCheckbox = document.getElementById('enable-caching');
    const limitOutputCheckbox = document.getElementById('limit-output');
    const batchProcessingCheckbox = document.getElementById('batch-processing');

    if (cachingCheckbox) {
      cachingCheckbox.onchange = () => {
        window.enhancedGPTService?.setOptimizations({ 
          useCache: cachingCheckbox.checked 
        });
      };
    }

    if (limitOutputCheckbox) {
      limitOutputCheckbox.onchange = () => {
        window.enhancedGPTService?.setOptimizations({ 
          maxOutputTokens: limitOutputCheckbox.checked ? 400 : 800 
        });
      };
    }

    if (batchProcessingCheckbox) {
      batchProcessingCheckbox.onchange = () => {
        window.enhancedGPTService?.setOptimizations({ 
          batchMode: batchProcessingCheckbox.checked 
        });
      };
    }
  }

  updateUsageUI() {
    const stats = this.getUsageStats();
    
    const todayCallsEl = document.getElementById('today-calls');
    const monthCallsEl = document.getElementById('month-calls');
    const peakHourEl = document.getElementById('peak-hour');
    
    if (todayCallsEl) todayCallsEl.textContent = stats.today.calls;
    if (monthCallsEl) monthCallsEl.textContent = stats.thisMonth.calls;
    if (peakHourEl) peakHourEl.textContent = stats.today.peakHour >= 0 ? stats.today.peakHour : '--';
  }

  // Get user-specific stats (without cost data)
  getUserStats(userId) {
    const userToday = userId && this.dailyUsage.byUser[userId] ? this.dailyUsage.byUser[userId] : { calls: 0 };
    const now = new Date();
    const today = now.getDate();
    
    return {
      today: {
        calls: userToday.calls,
        peakHour: this.dailyUsage.byHour.indexOf(Math.max(...this.dailyUsage.byHour))
      },
      thisMonth: {
        calls: userId ? this.getUserMonthlyUsage(userId) : this.monthlyUsage.totalCalls,
        avgPerDay: userId ? (this.getUserMonthlyUsage(userId) / today).toFixed(1) : (this.monthlyUsage.totalCalls / today).toFixed(1)
      }
    };
  }

  getUserMonthlyUsage(userId) {
    // For now, return total - in a real app you'd track monthly by user
    return this.dailyUsage.byUser[userId]?.calls || 0;
  }

  // Admin-only functions moved to separate admin dashboard
  // displayScenarioResults removed from user interface

  // Data persistence
  saveUsageData() {
    chrome.storage.local.set({
      costCalculatorData: {
        daily: this.dailyUsage,
        monthly: this.monthlyUsage,
        lastSaved: new Date().toISOString()
      }
    });
  }

  loadUsageData() {
    chrome.storage.local.get(['costCalculatorData'], (result) => {
      if (result.costCalculatorData) {
        this.dailyUsage = result.costCalculatorData.daily || this.dailyUsage;
        this.monthlyUsage = result.costCalculatorData.monthly || this.monthlyUsage;
      }
    });
  }

  resetUsageStats() {
    this.dailyUsage = {
      totalCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      byUser: {},
      byHour: new Array(24).fill(0)
    };
    
    this.monthlyUsage = {
      totalCalls: 0,
      totalCost: 0,
      byDay: new Array(31).fill(0),
      topUsers: []
    };
    
    this.saveUsageData();
  }

  scheduleResets() {
    // Reset daily stats at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyStats();
      // Set up daily reset
      setInterval(() => this.resetDailyStats(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  resetDailyStats() {
    this.dailyUsage = {
      totalCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      byUser: {},
      byHour: new Array(24).fill(0)
    };
    this.saveUsageData();
  }
}

// Create global instance
window.costCalculator = new CostCalculator();

// Helper function to track API calls from your GPT service
window.trackGPTCall = (prompt, instruction, response, userId) => {
  return window.costCalculator.trackApiCall(prompt, instruction, response, userId);
};
// Tier Selection and Management UI
// Handles the user interface for tier management

class TierUI {
  constructor() {
    this.tierService = window.tierService;
    this.setupEventListeners();
  }

  static getInstance() {
    if (!TierUI.instance) {
      TierUI.instance = new TierUI();
    }
    return TierUI.instance;
  }

  setupEventListeners() {
    // Listen for tier changes
    document.addEventListener('tierChanged', (event) => {
      this.updateAllTierDisplays(event.detail);
    });

    // Listen for settings modal opening
    document.addEventListener('DOMContentLoaded', () => {
      this.injectTierUI();
    });
  }

  // Inject tier UI into settings modal
  injectTierUI() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.id === 'settings-modal' || (node.querySelector && node.querySelector('#settings-modal'))) {
            setTimeout(() => this.addTierSectionToSettings(), 100);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Add tier section to settings modal
  addTierSectionToSettings() {
    const settingsContent = document.querySelector('.settings-content');
    if (!settingsContent || settingsContent.querySelector('#tier-section')) return;

    const tierSection = document.createElement('div');
    tierSection.id = 'tier-section';
    
    // Insert at the top of settings
    const firstChild = settingsContent.firstChild;
    settingsContent.insertBefore(tierSection, firstChild);
    
    this.renderTierSection(tierSection);
    this.attachTierListeners();
  }

  // Render the complete tier section
  renderTierSection(container) {
    const status = this.tierService.getTierStatus();
    
    container.innerHTML = `
      <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h2 style="font-size: 18px; margin: 0; color: #333;">
            🎯 Your Plan
          </h2>
          <div class="tier-badge tier-${status.tier}" style="
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            background: ${this.getTierColor(status.tier)};
            color: white;
          ">
            ${status.displayName}
          </div>
        </div>
        
        ${this.renderCurrentTierStatus(status)}
        ${this.renderTierOptions(status)}
      </div>
    `;
  }

  // Render current tier status
  renderCurrentTierStatus(status) {
    let statusHtml = '';
    
    if (status.tier === 'free') {
      statusHtml = `
        <div class="tier-status" style="
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          border-left: 4px solid #6c757d;
        ">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">
            📖 Free Plan
          </div>
          <div style="font-size: 12px; color: #666; line-height: 1.4;">
            Browse and copy prompts • No AI modifications
          </div>
        </div>
      `;
    }
    
    if (status.tier === 'byok') {
      const apiKeyStatus = status.hasApiKey ? '✅ Connected' : '⚠️ API Key Required';
      const statusColor = status.hasApiKey ? '#28a745' : '#ffc107';
      
      statusHtml = `
        <div class="tier-status" style="
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          border-left: 4px solid #17a2b8;
        ">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">
            🔑 BYOK Plan
          </div>
          <div style="font-size: 12px; color: #666; line-height: 1.4; margin-bottom: 8px;">
            Full features • Your API key • Unlimited usage
          </div>
          <div style="
            font-size: 11px;
            color: ${status.hasApiKey ? '#28a745' : '#856404'};
            font-weight: 500;
          ">
            ${apiKeyStatus}
          </div>
        </div>
      `;
    }
    
    if (status.tier === 'paid') {
      statusHtml = `
        <div class="tier-status" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          color: white;
        ">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">
            💳 Premium Plan
          </div>
          <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
            Full features • API costs covered • $4.99/month
          </div>
        </div>
      `;
    }
    
    return statusHtml;
  }

  // Render tier upgrade/management options
  renderTierOptions(status) {
    let optionsHtml = '';
    
    // Show upgrade options for free and BYOK users
    if (status.canUpgrade) {
      optionsHtml += `
        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 14px; margin-bottom: 12px; color: #333;">
            🚀 Upgrade Options
          </h4>
          <div style="display: grid; gap: 12px;">
      `;
      
      status.suggestions.forEach(suggestion => {
        const isCurrentTier = suggestion.tier === status.tier;
        const isComingSoon = suggestion.action === 'coming-soon';
        
        if (!isCurrentTier) {
          optionsHtml += `
            <div class="tier-option" style="
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 12px;
              background: ${isComingSoon ? '#f8f9fa' : 'white'};
              ${isComingSoon ? 'opacity: 0.7;' : ''}
            ">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                    ${suggestion.title}
                    ${suggestion.price ? `<span style="color: #28a745;">${suggestion.price}</span>` : ''}
                  </div>
                  <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
                    ${suggestion.description}
                  </div>
                </div>
                <button 
                  class="tier-action-btn"
                  data-tier="${suggestion.tier}"
                  data-action="${suggestion.action}"
                  ${isComingSoon ? 'disabled' : ''}
                  style="
                    background: ${isComingSoon ? '#6c757d' : '#4285f4'};
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: ${isComingSoon ? 'not-allowed' : 'pointer'};
                    white-space: nowrap;
                  "
                >
                  ${suggestion.buttonText}
                </button>
              </div>
            </div>
          `;
        }
      });
      
      optionsHtml += `
          </div>
        </div>
      `;
    }
    
    // Add BYOK API key management
    if (status.tier === 'byok') {
      optionsHtml += this.renderApiKeyManagement(status);
    }
    
    // Add tier management options
    optionsHtml += this.renderTierManagement(status);
    
    return optionsHtml;
  }

  // Render API key management for BYOK users
  renderApiKeyManagement(status) {
    const hasApiKey = status.hasApiKey;
    
    return `
      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 14px; margin-bottom: 8px; color: #333;">
          🔑 API Key Management
        </h4>
        <div style="
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        ">
          ${hasApiKey ? `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 12px; color: #28a745; margin-bottom: 4px;">
                ✅ API key connected and validated
              </div>
              <div style="font-size: 11px; color: #666;">
                Key: ••••••••••••${status.apiKey ? status.apiKey.slice(-4) : ''}
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button id="update-api-key" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                flex: 1;
              ">
                Update Key
              </button>
              <button id="test-api-key" style="
                background: #17a2b8;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                flex: 1;
              ">
                Test Key
              </button>
            </div>
          ` : `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 12px; color: #856404; margin-bottom: 4px;">
                ⚠️ OpenAI API key required
              </div>
              <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
                Add your OpenAI API key to enable AI-powered prompt modifications
              </div>
            </div>
            <button id="add-api-key" style="
              background: #28a745;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              font-size: 12px;
              cursor: pointer;
              width: 100%;
            ">
              Add OpenAI API Key
            </button>
          `}
        </div>
      </div>
    `;
  }

  // Render tier management options
  renderTierManagement(status) {
    return `
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
        <div style="display: flex; gap: 8px;">
          ${status.tier !== 'free' ? `
            <button id="downgrade-to-free" style="
              background: #fff;
              color: #dc3545;
              border: 1px solid #dc3545;
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 11px;
              cursor: pointer;
              flex: 1;
            ">
              Switch to Free
            </button>
          ` : ''}
          <button id="export-tier-info" style="
            background: #f8f9fa;
            color: #333;
            border: 1px solid #ddd;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            flex: 1;
          ">
            📊 Export Plan Info
          </button>
        </div>
      </div>
    `;
  }

  // Attach event listeners for tier actions
  attachTierListeners() {
    // Tier upgrade buttons
    document.querySelectorAll('.tier-action-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tier = e.target.dataset.tier;
        const action = e.target.dataset.action;
        
        if (action === 'coming-soon') {
          this.showMessage('💳 Premium plan coming soon! Use BYOK for now.', 'info');
          return;
        }
        
        if (tier === 'byok') {
          this.showApiKeyDialog();
        } else if (tier === 'paid') {
          try {
            await this.tierService.upgradeToPaid();
          } catch (error) {
            this.showMessage(error.message, 'warning');
          }
        }
      });
    });

    // API key management
    const addApiKeyBtn = document.getElementById('add-api-key');
    if (addApiKeyBtn) {
      addApiKeyBtn.addEventListener('click', () => this.showApiKeyDialog());
    }

    const updateApiKeyBtn = document.getElementById('update-api-key');
    if (updateApiKeyBtn) {
      updateApiKeyBtn.addEventListener('click', () => this.showApiKeyDialog(true));
    }

    const testApiKeyBtn = document.getElementById('test-api-key');
    if (testApiKeyBtn) {
      testApiKeyBtn.addEventListener('click', () => this.testCurrentApiKey());
    }

    // Tier management
    const downgradeBtn = document.getElementById('downgrade-to-free');
    if (downgradeBtn) {
      downgradeBtn.addEventListener('click', () => this.handleDowngrade());
    }

    const exportBtn = document.getElementById('export-tier-info');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportTierInfo());
    }
  }

  // Show API key input dialog
  showApiKeyDialog(isUpdate = false) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    dialog.innerHTML = `
      <div style="
        background: white;
        padding: 24px;
        border-radius: 8px;
        width: 400px;
        max-width: 90vw;
      ">
        <h3 style="margin: 0 0 16px 0; font-size: 16px;">
          🔑 ${isUpdate ? 'Update' : 'Add'} OpenAI API Key
        </h3>
        <div style="margin-bottom: 16px; font-size: 12px; color: #666; line-height: 1.4;">
          Your API key is stored securely and only used for your prompt modifications.
          <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #4285f4;">
            Get your key from OpenAI →
          </a>
        </div>
        <input 
          type="password" 
          id="api-key-input" 
          placeholder="sk-..." 
          style="
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            margin-bottom: 16px;
          "
        >
        <div style="display: flex; gap: 8px;">
          <button id="cancel-api-key" style="
            background: #f8f9fa;
            border: 1px solid #ddd;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            flex: 1;
          ">
            Cancel
          </button>
          <button id="save-api-key" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            flex: 1;
          ">
            ${isUpdate ? 'Update' : 'Add'} Key
          </button>
        </div>
        <div id="api-key-status" style="
          margin-top: 12px;
          font-size: 12px;
          text-align: center;
        "></div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const input = dialog.querySelector('#api-key-input');
    const saveBtn = dialog.querySelector('#save-api-key');
    const cancelBtn = dialog.querySelector('#cancel-api-key');
    const status = dialog.querySelector('#api-key-status');
    
    input.focus();
    
    // Handle save
    saveBtn.addEventListener('click', async () => {
      const apiKey = input.value.trim();
      if (!apiKey) {
        status.textContent = '❌ Please enter your API key';
        status.style.color = '#dc3545';
        return;
      }
      
      saveBtn.disabled = true;
      saveBtn.textContent = 'Validating...';
      status.textContent = '🔄 Validating API key...';
      status.style.color = '#6c757d';
      
      try {
        await this.tierService.upgradeToBYOK(apiKey);
        status.textContent = '✅ API key validated and saved!';
        status.style.color = '#28a745';
        
        setTimeout(() => {
          document.body.removeChild(dialog);
          this.showMessage('🎉 BYOK tier activated! You can now modify prompts.', 'success');
        }, 1500);
        
      } catch (error) {
        saveBtn.disabled = false;
        saveBtn.textContent = isUpdate ? 'Update' : 'Add' + ' Key';
        status.textContent = '❌ ' + error.message;
        status.style.color = '#dc3545';
      }
    });
    
    // Handle cancel
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    // Handle escape key
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        document.body.removeChild(dialog);
        document.removeEventListener('keydown', escapeHandler);
      }
    });
  }

  // Test current API key
  async testCurrentApiKey() {
    const apiKey = this.tierService.getApiKeyToUse();
    if (!apiKey) {
      this.showMessage('❌ No API key found', 'error');
      return;
    }
    
    this.showMessage('🔄 Testing API key...', 'info');
    
    try {
      const isValid = await this.tierService.validateApiKey(apiKey);
      if (isValid) {
        this.showMessage('✅ API key is valid and working!', 'success');
      } else {
        this.showMessage('❌ API key test failed', 'error');
      }
    } catch (error) {
      this.showMessage('❌ API key test failed: ' + error.message, 'error');
    }
  }

  // Handle tier downgrade
  async handleDowngrade() {
    if (!confirm('Switch to Free tier? You will lose access to AI prompt modifications.')) {
      return;
    }
    
    try {
      await this.tierService.downgradeToFree();
      this.showMessage('Switched to Free tier', 'info');
    } catch (error) {
      this.showMessage('Failed to downgrade: ' + error.message, 'error');
    }
  }

  // Export tier information
  exportTierInfo() {
    const tierData = this.tierService.exportTierData();
    
    const blob = new Blob([JSON.stringify(tierData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veo3-tier-info-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showMessage('📊 Tier info exported', 'success');
  }

  // Get tier color for styling
  getTierColor(tier) {
    const colors = {
      free: '#6c757d',
      byok: '#17a2b8', 
      paid: '#667eea'
    };
    return colors[tier] || '#6c757d';
  }

  // Update all tier displays when tier changes
  updateAllTierDisplays(tierData) {
    // Re-render tier section if it exists
    const tierSection = document.getElementById('tier-section');
    if (tierSection) {
      this.renderTierSection(tierSection);
      this.attachTierListeners();
    }
    
    // Update tier badge in main UI
    const tierBadge = document.querySelector('.tier-badge');
    if (tierBadge) {
      tierBadge.textContent = tierData.status.displayName;
      tierBadge.className = `tier-badge tier-${tierData.tier}`;
    }
  }

  // Show temporary message
  showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
      color: ${type === 'warning' ? '#856404' : 'white'};
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10001;
      animation: slideIn 0.3s ease;
    `;
    
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    }, 3000);
  }
}

// Create global instance
window.tierUI = TierUI.getInstance();

console.log('🎨 TierUI initialized');
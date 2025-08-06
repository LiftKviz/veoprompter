// User Preferences UI - Theme switcher and personalization settings

class PreferencesUI {
  constructor() {
    this.themes = {
      light: {
        name: 'Light',
        background: '#ffffff',
        text: '#202124',
        border: '#dadce0',
        hover: '#f8f9fa',
        primary: '#4285f4'
      },
      dark: {
        name: 'Dark',
        background: '#202124',
        text: '#e8eaed',
        border: '#5f6368',
        hover: '#303134',
        primary: '#8ab4f8'
      },
      blue: {
        name: 'Blue',
        background: '#f0f7ff',
        text: '#1a237e',
        border: '#c5cae9',
        hover: '#e8eaf6',
        primary: '#3f51b5'
      }
    };
    
    this.currentTheme = 'light';
    this.init();
  }

  init() {
    // Load user preferences
    if (window.userDataService) {
      const prefs = window.userDataService.getPreferences();
      this.currentTheme = prefs.theme || 'light';
      this.applyTheme(this.currentTheme);
    }

    // Listen for preference updates
    window.addEventListener('preferencesUpdated', (e) => {
      if (e.detail.theme && e.detail.theme !== this.currentTheme) {
        this.currentTheme = e.detail.theme;
        this.applyTheme(this.currentTheme);
      }
    });

    // Enhance settings modal
    this.enhanceSettingsModal();
  }

  enhanceSettingsModal() {
    // Watch for settings modal to appear
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.id === 'settings-modal' || (node.querySelector && node.querySelector('#settings-modal'))) {
            this.addPreferencesSection();
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  addPreferencesSection() {
    const settingsContent = document.querySelector('.settings-content');
    if (!settingsContent || settingsContent.querySelector('#preferences-section')) return;

    // Create preferences section
    const prefsSection = document.createElement('div');
    prefsSection.id = 'preferences-section';
    prefsSection.style.cssText = `
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    `;

    prefsSection.innerHTML = `
      <h3 style="font-size: 16px; margin-bottom: 12px;">🎨 Personalization</h3>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 13px; margin-bottom: 8px; font-weight: 500;">
          Theme
        </label>
        <div id="theme-selector" style="display: flex; gap: 8px;">
          ${Object.entries(this.themes).map(([key, theme]) => `
            <button class="theme-option" data-theme="${key}" style="
              padding: 8px 16px;
              border: 2px solid ${theme.border};
              background: ${theme.background};
              color: ${theme.text};
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              transition: all 0.2s;
              ${key === this.currentTheme ? 'border-color: ' + theme.primary + '; font-weight: 600;' : ''}
            ">
              ${theme.name}
            </button>
          `).join('')}
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 13px; margin-bottom: 8px; font-weight: 500;">
          Default Category
        </label>
        <select id="default-category" style="
          width: 100%;
          padding: 6px;
          border: 1px solid #dadce0;
          border-radius: 4px;
          font-size: 13px;
        ">
          <option value="all">All Categories</option>
          <option value="ads">Ads</option>
          <option value="storytelling">Storytelling</option>
          <option value="tutorial">Tutorial</option>
          <option value="vlogging">Vlogging</option>
          <option value="my-prompts">My Prompts</option>
        </select>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: flex; align-items: center; font-size: 13px; cursor: pointer;">
          <input type="checkbox" id="auto-save-modified" style="margin-right: 8px;">
          Automatically save modified prompts
        </label>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: flex; align-items: center; font-size: 13px; cursor: pointer;">
          <input type="checkbox" id="show-tooltips" style="margin-right: 8px;">
          Show helpful tooltips
        </label>
      </div>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
        <h4 style="font-size: 14px; margin-bottom: 8px;">📊 Your Usage Stats</h4>
        <div id="usage-stats" style="
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          line-height: 1.6;
        ">
          Loading stats...
        </div>
      </div>

      <div style="margin-top: 16px;">
        <button id="export-all-data" style="
          background: #f0f0f0;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          margin-right: 8px;
        ">
          📥 Export All Data
        </button>
        <button id="reset-preferences" style="
          background: #fff;
          border: 1px solid #dc3545;
          color: #dc3545;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        ">
          🔄 Reset to Defaults
        </button>
      </div>
    `;

    settingsContent.appendChild(prefsSection);

    // Add event listeners
    this.attachPreferenceListeners();
    this.loadCurrentPreferences();
    this.loadUsageStats();
  }

  attachPreferenceListeners() {
    // Theme selector
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.onclick = () => {
        const theme = btn.dataset.theme;
        this.currentTheme = theme;
        this.applyTheme(theme);
        window.userDataService.updatePreferences({ theme });
        
        // Update button styles
        document.querySelectorAll('.theme-option').forEach(b => {
          const t = this.themes[b.dataset.theme];
          b.style.borderColor = t.border;
          b.style.fontWeight = '400';
        });
        btn.style.borderColor = this.themes[theme].primary;
        btn.style.fontWeight = '600';
      };
    });

    // Default category
    const categorySelect = document.getElementById('default-category');
    if (categorySelect) {
      categorySelect.onchange = () => {
        window.userDataService.updatePreferences({ 
          defaultCategory: categorySelect.value 
        });
      };
    }

    // Auto-save checkbox
    const autoSaveCheck = document.getElementById('auto-save-modified');
    if (autoSaveCheck) {
      autoSaveCheck.onchange = () => {
        window.userDataService.updatePreferences({ 
          autoSaveModified: autoSaveCheck.checked 
        });
      };
    }

    // Tooltips checkbox
    const tooltipsCheck = document.getElementById('show-tooltips');
    if (tooltipsCheck) {
      tooltipsCheck.onchange = () => {
        window.userDataService.updatePreferences({ 
          showTooltips: tooltipsCheck.checked 
        });
      };
    }

    // Export button
    const exportBtn = document.getElementById('export-all-data');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const data = window.userDataService.exportUserData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `veo3-all-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      };
    }

    // Reset button
    const resetBtn = document.getElementById('reset-preferences');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm('Reset all preferences to defaults?')) {
          window.userDataService.updatePreferences({
            theme: 'light',
            defaultCategory: 'all',
            autoSaveModified: false,
            showTooltips: true
          });
          this.loadCurrentPreferences();
        }
      };
    }
  }

  loadCurrentPreferences() {
    const prefs = window.userDataService.getPreferences();
    
    // Set current values
    const categorySelect = document.getElementById('default-category');
    if (categorySelect) {
      categorySelect.value = prefs.defaultCategory || 'all';
    }

    const autoSaveCheck = document.getElementById('auto-save-modified');
    if (autoSaveCheck) {
      autoSaveCheck.checked = prefs.autoSaveModified || false;
    }

    const tooltipsCheck = document.getElementById('show-tooltips');
    if (tooltipsCheck) {
      tooltipsCheck.checked = prefs.showTooltips !== false;
    }
  }

  loadUsageStats() {
    const analytics = window.userDataService?.analytics || {};
    const statsDiv = document.getElementById('usage-stats');
    
    if (statsDiv) {
      const stats = [
        `📝 Prompts created: ${analytics.promptsCreated || 0}`,
        `✏️ Prompts modified: ${analytics.promptsModified || 0}`,
        `📋 Prompts copied: ${analytics.promptsCopied || 0}`,
        `🔢 Total interactions: ${analytics.totalUsage || 0}`,
        `📅 Last active: ${analytics.lastActive ? new Date(analytics.lastActive).toLocaleDateString() : 'Today'}`
      ];
      
      statsDiv.innerHTML = stats.join('<br>');
    }
  }

  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    // Create or update theme styles
    let themeStyle = document.getElementById('user-theme-styles');
    if (!themeStyle) {
      themeStyle = document.createElement('style');
      themeStyle.id = 'user-theme-styles';
      document.head.appendChild(themeStyle);
    }

    themeStyle.textContent = `
      body {
        background-color: ${theme.background} !important;
        color: ${theme.text} !important;
      }
      
      .app {
        background-color: ${theme.background} !important;
        color: ${theme.text} !important;
      }
      
      .header {
        background-color: ${theme.background} !important;
        border-bottom-color: ${theme.border} !important;
      }
      
      .category-card, .prompt-card {
        background-color: ${theme.hover} !important;
        border-color: ${theme.border} !important;
        color: ${theme.text} !important;
      }
      
      .category-card:hover, .prompt-card:hover {
        border-color: ${theme.primary} !important;
      }
      
      .modal-content {
        background-color: ${theme.background} !important;
        color: ${theme.text} !important;
      }
      
      input, textarea, select {
        background-color: ${theme.hover} !important;
        border-color: ${theme.border} !important;
        color: ${theme.text} !important;
      }
      
      button.primary {
        background-color: ${theme.primary} !important;
      }
      
      .settings-content {
        color: ${theme.text} !important;
      }
    `;

    // Save theme preference
    document.body.dataset.theme = themeName;
  }
}

// Initialize preferences UI
window.preferencesUI = new PreferencesUI();
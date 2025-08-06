// Personal Prompts UI - Shows user's saved prompts with management options

class PersonalPromptsUI {
  constructor() {
    this.initialized = false;
    this.container = null;
    this.init();
  }

  init() {
    // Listen for user data events
    window.addEventListener('userDataLoaded', (e) => {
      this.updateUI(e.detail);
    });
    
    window.addEventListener('promptSaved', (e) => {
      this.addPromptToUI(e.detail);
      this.showNotification('✅ Prompt saved to your library!');
    });
    
    window.addEventListener('promptDeleted', (e) => {
      this.removePromptFromUI(e.detail);
      this.showNotification('🗑️ Prompt deleted');
    });

    // Wait for DOM and inject UI
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.injectUI());
    } else {
      this.injectUI();
    }
  }

  injectUI() {
    // Find or create My Prompts section
    const checkForContainer = () => {
      const mainView = document.getElementById('main-view');
      if (!mainView) {
        setTimeout(checkForContainer, 100);
        return;
      }

      // Add personal prompts indicator to categories or My Prompts
      this.enhanceExistingUI();
      this.initialized = true;
    };
    
    checkForContainer();
  }

  enhanceExistingUI() {
    // Add save buttons to existing prompt cards
    const enhancePromptCards = () => {
      const promptCards = document.querySelectorAll('.prompt-card');
      promptCards.forEach(card => {
        if (card.querySelector('.save-prompt-btn')) return; // Already enhanced
        
        const actionsDiv = card.querySelector('.prompt-actions');
        if (actionsDiv) {
          const saveBtn = document.createElement('button');
          saveBtn.className = 'action-button save-prompt-btn';
          saveBtn.innerHTML = '💾';
          saveBtn.title = 'Save to My Library';
          saveBtn.style.cssText = `
            background: #4285f4;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 12px;
            margin-left: 4px;
          `;
          
          saveBtn.onclick = (e) => {
            e.stopPropagation();
            const promptData = this.extractPromptData(card);
            this.savePrompt(promptData);
          };
          
          actionsDiv.appendChild(saveBtn);
        }
      });
    };

    // Enhance My Prompts category with user's saved prompts
    const enhanceMyPrompts = () => {
      // Check if we're in My Prompts view
      const title = document.querySelector('.category-title');
      if (title && title.textContent.includes('My Prompts')) {
        this.displayPersonalPrompts();
      }
    };

    // Add personal prompts count to My Prompts category card
    const updateMyPromptsCount = () => {
      const categoryCards = document.querySelectorAll('.category-card');
      categoryCards.forEach(card => {
        const titleEl = card.querySelector('.category-name');
        if (titleEl && titleEl.textContent === 'My Prompts') {
          const userPrompts = window.userDataService?.getUserPrompts() || [];
          const countEl = card.querySelector('.prompt-count');
          if (countEl) {
            const defaultCount = parseInt(countEl.textContent) || 0;
            const totalCount = defaultCount + userPrompts.length;
            countEl.textContent = `${totalCount} prompts`;
            
            // Add indicator for personal prompts
            if (userPrompts.length > 0 && !card.querySelector('.personal-indicator')) {
              const indicator = document.createElement('span');
              indicator.className = 'personal-indicator';
              indicator.textContent = `(${userPrompts.length} personal)`;
              indicator.style.cssText = `
                font-size: 11px;
                color: #4285f4;
                margin-left: 4px;
              `;
              countEl.appendChild(indicator);
            }
          }
        }
      });
    };

    // Run enhancements
    enhancePromptCards();
    enhanceMyPrompts();
    updateMyPromptsCount();

    // Set up observer for dynamic content
    const observer = new MutationObserver(() => {
      enhancePromptCards();
      enhanceMyPrompts();
      updateMyPromptsCount();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  displayPersonalPrompts() {
    const mainView = document.getElementById('main-view');
    if (!mainView) return;

    const userPrompts = window.userDataService?.getUserPrompts() || [];
    if (userPrompts.length === 0) return;

    // Check if personal prompts section already exists
    let personalSection = document.getElementById('personal-prompts-section');
    if (!personalSection) {
      // Create section divider
      personalSection = document.createElement('div');
      personalSection.id = 'personal-prompts-section';
      personalSection.style.cssText = `
        margin-top: 20px;
        padding-top: 20px;
        border-top: 2px solid #e0e0e0;
      `;
      
      personalSection.innerHTML = `
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        ">
          <h3 style="
            font-size: 14px;
            font-weight: 600;
            color: #4285f4;
            margin: 0;
          ">
            📚 Your Personal Library
          </h3>
          <button id="export-prompts-btn" style="
            background: #f0f0f0;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          ">
            📥 Export
          </button>
        </div>
        <div id="personal-prompts-list"></div>
      `;
      
      mainView.appendChild(personalSection);
      
      // Add export functionality
      document.getElementById('export-prompts-btn').onclick = () => {
        this.exportPrompts();
      };
    }

    // Display prompts
    const listContainer = document.getElementById('personal-prompts-list');
    listContainer.innerHTML = '';
    
    userPrompts.forEach(prompt => {
      const promptCard = this.createPersonalPromptCard(prompt);
      listContainer.appendChild(promptCard);
    });
  }

  createPersonalPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card personal-prompt-card';
    card.dataset.promptId = prompt.id;
    card.style.cssText = `
      background: #f8f9fa;
      border: 1px solid #dadce0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    `;
    
    card.innerHTML = `
      <div class="prompt-header" style="display: flex; justify-content: space-between; align-items: start;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500;">
          ${prompt.title || 'Untitled Prompt'}
        </h4>
        <button class="delete-btn" style="
          background: transparent;
          border: none;
          color: #dc3545;
          cursor: pointer;
          padding: 2px 6px;
          font-size: 16px;
        " title="Delete prompt">🗑️</button>
      </div>
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #5f6368; 
         max-height: 40px; overflow: hidden; text-overflow: ellipsis;">
        ${prompt.prompt || prompt.content || ''}
      </p>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; color: #5f6368;">
          Saved ${new Date(prompt.savedAt).toLocaleDateString()}
        </span>
        <div class="prompt-actions" style="display: flex; gap: 4px;">
          <button class="action-button copy-btn" title="Copy prompt">📋</button>
          <button class="action-button use-btn" title="Use prompt">▶️</button>
        </div>
      </div>
    `;
    
    // Add click handlers
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm('Delete this prompt from your library?')) {
        window.userDataService.deletePrompt(prompt.id);
      }
    };
    
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(prompt.prompt || prompt.content || '');
      this.showNotification('📋 Copied to clipboard!');
      window.userDataService.trackPromptUsage('copy', prompt.id);
    };
    
    const useBtn = card.querySelector('.use-btn');
    useBtn.onclick = (e) => {
      e.stopPropagation();
      // Trigger the same action as clicking the prompt card
      card.click();
    };
    
    // Expand on click
    card.onclick = () => {
      const contentEl = card.querySelector('p');
      if (contentEl.style.maxHeight === '40px') {
        contentEl.style.maxHeight = 'none';
      } else {
        contentEl.style.maxHeight = '40px';
      }
    };
    
    return card;
  }

  extractPromptData(card) {
    // Extract prompt data from a card element
    const titleEl = card.querySelector('h3, h4, .prompt-title');
    const contentEl = card.querySelector('p, .prompt-content');
    const categoryEl = card.querySelector('.prompt-category');
    
    return {
      title: titleEl?.textContent || 'Untitled',
      prompt: contentEl?.textContent || '',
      content: contentEl?.textContent || '',
      category: categoryEl?.textContent || 'My Prompts',
      source: 'extension',
      extractedAt: new Date().toISOString()
    };
  }

  savePrompt(promptData) {
    window.userDataService.savePrompt(promptData);
  }

  exportPrompts() {
    const data = window.userDataService.exportUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veo3-prompts-${data.user.email}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showNotification('📥 Prompts exported!');
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 13px;
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  updateUI(data) {
    // Update UI when user data changes
    if (data.user) {
      // User is signed in, enhance UI
      this.enhanceExistingUI();
    }
  }

  addPromptToUI(prompt) {
    // Refresh the UI to show new prompt
    this.enhanceExistingUI();
  }

  removePromptFromUI(promptId) {
    // Remove prompt card from UI
    const card = document.querySelector(`[data-prompt-id="${promptId}"]`);
    if (card) {
      card.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => card.remove(), 300);
    }
  }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(20px); opacity: 0; }
  }
  .action-button {
    background: #f0f0f0;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }
  .action-button:hover {
    background: #e0e0e0;
    transform: translateY(-1px);
  }
  .personal-prompt-card:hover {
    border-color: #4285f4;
    box-shadow: 0 2px 8px rgba(66, 133, 244, 0.1);
  }
`;
document.head.appendChild(style);

// Initialize
window.personalPromptsUI = new PersonalPromptsUI();
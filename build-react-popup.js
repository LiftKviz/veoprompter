// Build script to create React-powered popup
const fs = require('fs');
const path = require('path');

// Read the GPT service for prompt modification
const gptServiceCode = fs.readFileSync('./src/services/gptService.ts', 'utf8');

// Create a hybrid popup that includes the React components compiled to vanilla JS
const popupWithReact = `
// React-powered popup with all features including prompt modification
document.addEventListener('DOMContentLoaded', async () => {
  // GPT Service (compiled from TypeScript)
  class GPTService {
    constructor() {
      this.apiKey = null;
      this.knowledgeBase = null;
    }

    static getInstance() {
      if (!GPTService.instance) {
        GPTService.instance = new GPTService();
      }
      return GPTService.instance;
    }

    async loadKnowledgeBase() {
      if (this.knowledgeBase) return this.knowledgeBase;
      
      try {
        const response = await fetch('/data/knowledge-base.json');
        this.knowledgeBase = await response.json();
        return this.knowledgeBase;
      } catch (error) {
        console.error('Failed to load knowledge base:', error);
        return null;
      }
    }

    generateSystemPrompt(_knowledgeBase) {
      return \`You are an expert AI prompt engineer specializing in Google Veo 3. Transform ideas into prompts using the SSASA framework:

1) SUBJECT: Clearly identify who/what is the focus with specific details (e.g., 'grizzled detective in rumpled trench coat' not 'a man')
2) SCENE: Describe environment in detail - where and when action occurs (e.g., 'dusty attic with afternoon light through grimy window')
3) ACTION: Define what subject is doing with strong verbs, chain actions with 'this happens, then that happens'
4) STYLE: Specify visual aesthetic (e.g., '1990s VHS footage', '8-bit video game', 'claymation', 'filmed on 16mm')
5) AUDIO: Explicitly describe all sounds - dialogue, ambient sounds, SFX, and music (Veo 3's signature feature)

For dialogue, use format: "Character Name says (with emotional tone): 'Exact words.'" - This prevents mixing up speakers.

Include negative prompt (no subtitles, no on-screen text) unless requested. Keep modifications concise and focused on the user's instruction while maintaining Veo 3 best practices.\`;
    }

    async setApiKey(key) {
      this.apiKey = key;
      await chrome.storage.local.set({ gptApiKey: key });
    }

    async getApiKey() {
      if (this.apiKey) return this.apiKey;
      
      const result = await chrome.storage.local.get(['gptApiKey']);
      this.apiKey = result.gptApiKey || null;
      return this.apiKey;
    }

    async modifyPrompt(request) {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        throw new Error('🔑 API key required: Please add your OpenAI API key in settings to use prompt modification features.');
      }

      if (!request.instruction?.trim()) {
        throw new Error('📝 Modification instruction required: Please describe how you want to modify the prompt.');
      }

      const knowledgeBase = await this.loadKnowledgeBase();
      const systemPrompt = this.generateSystemPrompt(knowledgeBase);

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${apiKey}\`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: \`Original prompt: "\${request.prompt}"\\n\\nModification instruction: "\${request.instruction}"\\n\\nPlease modify the prompt according to the instruction using the SSASA framework.\`
              }
            ],
            temperature: 0.7,
            max_tokens: 800
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message;
          
          if (response.status === 401) {
            throw new Error('🔐 Invalid API key: Please check your OpenAI API key in settings and ensure it\\'s valid.');
          } else if (response.status === 403) {
            throw new Error('🚫 Access denied: Your API key doesn\\'t have permission to access GPT-4. Please check your OpenAI account.');
          } else if (response.status === 429) {
            throw new Error('⏰ Rate limit exceeded: Please wait a moment and try again. Consider upgrading your OpenAI plan for higher limits.');
          } else if (response.status === 500) {
            throw new Error('🔧 OpenAI server error: Please try again in a few moments.');
          } else if (response.status >= 400 && response.status < 500) {
            throw new Error(\`❌ Request error: \${errorMessage || 'Please check your request and try again.'}\`);
          } else {
            throw new Error(\`🌐 Network error: \${errorMessage || 'Please check your internet connection and try again.'}\`);
          }
        }

        const data = await response.json();
        
        if (!data.choices?.[0]?.message?.content) {
          throw new Error('📭 Empty response: The AI didn\\'t generate a response. Please try again with a different instruction.');
        }
        
        return data.choices[0].message.content.trim();
      } catch (error) {
        console.error('GPT API error:', error);
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('🌐 Connection failed: Please check your internet connection and try again.');
        }
        
        throw error;
      }
    }
  }

  // Initialize GPT service
  const gptService = GPTService.getInstance();

  // HTML structure with accessibility improvements
  document.body.innerHTML = \`
    <div class="app">
      <header class="header" role="banner">
        <div class="header-content">
          <h1 class="header-title">Veo 3 Prompt Assistant</h1>
          <div class="header-actions">
            <div class="search-container" style="display: none;">
              <input 
                type="text" 
                id="search-input" 
                class="search-input" 
                placeholder="Search prompts..." 
                aria-label="Search prompts"
              />
              <button id="clear-search" class="icon-button" aria-label="Clear search">✕</button>
            </div>
            <button id="search-btn" class="icon-button" aria-label="Search prompts">🔍</button>
            <div class="api-status">
              <span id="status-indicator" class="status-indicator" aria-label="API connection status">⚪</span>
            </div>
            <button id="settings-btn" class="icon-button" aria-label="Open settings">⚙️</button>
          </div>
        </div>
      </header>
      <main class="app-content" role="main">
        <div id="onboarding-banner" style="display: none;" class="onboarding-banner" role="region" aria-labelledby="onboarding-title">
          <h3 id="onboarding-title">🚀 Get Started!</h3>
          <p>Add your OpenAI API key to unlock prompt modification features.</p>
          <button class="primary" id="setup-api-key">Setup API Key</button>
        </div>
        <div id="main-view"></div>
      </main>
    </div>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        width: 400px; 
        height: 600px; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: #333;
        background: #f5f5f5;
      }
      .app { height: 100%; display: flex; flex-direction: column; }
      .header {
        background: white;
        border-bottom: 1px solid #e0e0e0;
        padding: 12px 16px;
      }
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header-title {
        font-size: 18px;
        font-weight: 500;
        color: #333;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .search-container {
        display: flex;
        align-items: center;
        background: #f8f9fa;
        border: 1px solid #e0e0e0;
        border-radius: 20px;
        padding: 4px 8px;
        transition: all 0.2s;
      }
      .search-container:focus-within {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
      .search-input {
        border: none;
        background: transparent;
        outline: none;
        padding: 4px 8px;
        font-size: 14px;
        width: 150px;
      }
      .icon-button {
        background: transparent;
        border: none;
        padding: 6px;
        cursor: pointer;
        border-radius: 4px;
        font-size: 16px;
        transition: background-color 0.2s;
      }
      .icon-button:hover, .icon-button:focus { 
        background: #f0f0f0; 
        outline: 2px solid #3b82f6;
        outline-offset: 1px;
      }
      .status-indicator.connected { color: #22c55e; }
      .status-indicator.disconnected { color: #ef4444; }
      .app-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      .category-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .category-card {
        background: white;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s;
        text-decoration: none;
        color: inherit;
      }
      .category-card:hover, .category-card:focus {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        outline: 2px solid #3b82f6;
        outline-offset: 1px;
      }
      .category-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      .category-name {
        font-weight: 500;
        margin-bottom: 4px;
      }
      .category-description {
        font-size: 12px;
        color: #666;
      }
      .category-count {
        font-size: 11px;
        color: #999;
        margin-top: 4px;
      }
      .prompt-list {
        background: white;
        border-radius: 8px;
        padding: 16px;
      }
      .back-button {
        background: transparent;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: #3b82f6;
        font-size: 14px;
        margin-bottom: 16px;
        transition: background-color 0.2s;
      }
      .back-button:hover, .back-button:focus {
        background: #f0f0f0;
        outline: 2px solid #3b82f6;
        outline-offset: 1px;
      }
      .prompt-card {
        background: #f8f9fa;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .prompt-card:hover, .prompt-card:focus-within {
        background: #f0f1f3;
        border-color: #3b82f6;
      }
      .prompt-card.expanded {
        background: white;
        border-color: #3b82f6;
      }
      .prompt-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .prompt-title {
        font-weight: 500;
        margin-bottom: 0;
      }
      .expand-icon {
        font-size: 12px;
        color: #666;
      }
      .prompt-content {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e0e0e0;
      }
      .prompt-text {
        font-size: 13px;
        line-height: 1.5;
        color: #555;
        margin-bottom: 12px;
        white-space: pre-wrap;
        max-height: 200px;
        overflow-y: auto;
      }
      .prompt-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
      }
      .action-button {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .action-button:hover, .action-button:focus {
        background: #f0f0f0;
        border-color: #3b82f6;
        outline: 2px solid #3b82f6;
        outline-offset: 1px;
      }
      .action-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .action-button.loading {
        position: relative;
        color: transparent;
      }
      .action-button.loading::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        border: 2px solid #3b82f6;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
      .settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        z-index: 1000;
      }
      .settings-modal {
        background: white;
        border-radius: 8px;
        padding: 24px;
        width: 100%;
        max-width: 360px;
      }
      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .close-button {
        background: transparent;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 4px;
        transition: background-color 0.2s;
      }
      .close-button:hover, .close-button:focus {
        background: #f0f0f0;
        outline: 2px solid #3b82f6;
        outline-offset: 1px;
      }
      .api-key-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        margin-bottom: 16px;
        font-family: monospace;
        font-size: 13px;
        transition: border-color 0.2s;
      }
      .api-key-input:focus {
        border-color: #3b82f6;
        outline: 2px solid rgba(59, 130, 246, 0.1);
        outline-offset: 1px;
      }
      .primary {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      }
      .primary:hover, .primary:focus { 
        background: #2563eb; 
        outline: 2px solid #1d4ed8;
        outline-offset: 1px;
      }
      .onboarding-banner {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        padding: 16px;
        text-align: center;
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .onboarding-banner h3 {
        margin-bottom: 8px;
      }
      .onboarding-banner p {
        margin-bottom: 12px;
        opacity: 0.9;
      }
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #666;
      }
      .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 2000;
        animation: slideUp 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
      }
      .toast.error {
        background: #dc2626;
      }
      .toast.success {
        background: #16a34a;
      }
      @keyframes slideUp {
        from {
          transform: translateX(-50%) translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
      .modify-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        z-index: 1000;
      }
      .modify-content {
        background: white;
        border-radius: 8px;
        padding: 24px;
        width: 100%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
      }
      .modify-instruction {
        width: 100%;
        min-height: 80px;
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        margin-bottom: 16px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
        transition: border-color 0.2s;
      }
      .modify-instruction:focus {
        border-color: #3b82f6;
        outline: 2px solid rgba(59, 130, 246, 0.1);
        outline-offset: 1px;
      }
      .modify-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      .secondary {
        background: white;
        color: #333;
        border: 1px solid #e0e0e0;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }
      .secondary:hover, .secondary:focus {
        background: #f8f9fa;
        border-color: #3b82f6;
        outline: 2px solid rgba(59, 130, 246, 0.1);
        outline-offset: 1px;
      }
      .search-results {
        margin-bottom: 16px;
        font-size: 14px;
        color: #666;
      }
      .highlight {
        background: #fef3c7;
        padding: 1px 2px;
        border-radius: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    </style>
  \`;

  // State
  let hasApiKey = false;
  let currentView = 'categories';
  let currentCategory = null;
  let allPrompts = [];
  let savedPrompts = [];
  let searchMode = false;
  let searchQuery = '';
  let currentModifyPrompt = null;

  // Load prompts from file
  async function loadPrompts() {
    try {
      const response = await fetch(chrome.runtime.getURL('data/prompts.txt'));
      const text = await response.text();
      const lines = text.split('\\n').filter(line => line.trim() && !line.startsWith('#'));
      
      allPrompts = lines.map((line, index) => {
        const [category, title, prompt, youtubeLink] = line.split('|');
        return {
          id: \`prompt-\${index}\`,
          category: category?.trim(),
          title: title?.trim(),
          prompt: prompt?.trim(),
          youtubeLink: youtubeLink?.trim()
        };
      }).filter(p => p.category && p.title && p.prompt);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  }

  // Load saved prompts from storage
  async function loadSavedPrompts() {
    const result = await chrome.storage.local.get(['savedPrompts']);
    savedPrompts = result.savedPrompts || [];
  }

  // Check API key status
  async function checkApiKey() {
    const result = await chrome.storage.local.get(['gptApiKey']);
    hasApiKey = Boolean(result.gptApiKey);
    updateApiStatus();
    updateOnboardingBanner();
  }

  function updateApiStatus() {
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
      indicator.textContent = hasApiKey ? '🟢' : '🔴';
      indicator.className = \`status-indicator \${hasApiKey ? 'connected' : 'disconnected'}\`;
      indicator.title = hasApiKey ? 'API key configured' : 'API key required';
    }
  }

  function updateOnboardingBanner() {
    const banner = document.getElementById('onboarding-banner');
    if (banner) {
      banner.style.display = (!hasApiKey && currentView === 'categories') ? 'block' : 'none';
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = \`toast \${type}\`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Search functionality
  function performSearch(query) {
    if (!query.trim()) return allPrompts;
    
    const searchTerm = query.toLowerCase();
    return allPrompts.filter(prompt => 
      prompt.title.toLowerCase().includes(searchTerm) ||
      prompt.prompt.toLowerCase().includes(searchTerm) ||
      prompt.category.toLowerCase().includes(searchTerm)
    );
  }

  function highlightText(text, query) {
    if (!query.trim()) return text;
    
    const escapedQuery = query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    const regex = new RegExp(\`(\${escapedQuery})\`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  function showSearchResults(results, query) {
    currentView = 'search';
    const mainView = document.getElementById('main-view');
    
    mainView.innerHTML = \`
      <div class="prompt-list" role="region" aria-labelledby="search-results-title">
        <button class="back-button" id="back-btn" aria-label="Back to categories">← Back</button>
        <h2 id="search-results-title">Search Results</h2>
        <div class="search-results">\${results.length} prompt\${results.length !== 1 ? 's' : ''} found for "\${query}"</div>
        \${results.length === 0 ? 
          \`<div class="empty-state">
            <p>No prompts found matching your search. Try different keywords.</p>
          </div>\` :
          results.map((prompt) => \`
            <div class="prompt-card" data-id="\${prompt.id}" role="article" aria-labelledby="prompt-title-\${prompt.id}">
              <div class="prompt-header" role="button" tabindex="0" aria-expanded="false" aria-controls="prompt-content-\${prompt.id}">
                <div class="prompt-title" id="prompt-title-\${prompt.id}">\${highlightText(prompt.title, query)}</div>
                <span class="expand-icon" aria-hidden="true">▶</span>
              </div>
              <div class="prompt-content" id="prompt-content-\${prompt.id}" style="display: none;" role="region" aria-labelledby="prompt-title-\${prompt.id}">
                <div class="prompt-text">\${highlightText(prompt.prompt, query)}</div>
                <div class="prompt-actions" role="group" aria-label="Prompt actions">
                  <button class="action-button" data-action="copy" data-id="\${prompt.id}" aria-label="Copy prompt to clipboard">📋 Copy</button>
                  <button class="action-button" data-action="modify" data-id="\${prompt.id}" aria-label="Modify prompt with AI">✏️ Modify</button>
                  \${prompt.youtubeLink ? \`<button class="action-button" data-action="preview" data-id="\${prompt.id}" aria-label="Preview example video">▶️ Preview</button>\` : ''}
                  <button class="action-button" data-action="save" data-id="\${prompt.id}" aria-label="Save to favorites">⭐ Save</button>
                </div>
              </div>
            </div>
          \`).join('')
        }
      </div>
    \`;

    // Add event listeners
    setupPromptCardListeners(results);
    document.getElementById('back-btn').addEventListener('click', () => {
      exitSearchMode();
      showCategories();
    });
  }

  function enterSearchMode() {
    searchMode = true;
    document.querySelector('.search-container').style.display = 'flex';
    document.getElementById('search-btn').style.display = 'none';
    document.getElementById('search-input').focus();
  }

  function exitSearchMode() {
    searchMode = false;
    searchQuery = '';
    document.querySelector('.search-container').style.display = 'none';
    document.getElementById('search-btn').style.display = 'block';
    document.getElementById('search-input').value = '';
  }

  function showCategories() {
    currentView = 'categories';
    const mainView = document.getElementById('main-view');
    
    const categories = [
      { id: 'ads', name: 'Ads', icon: '📺', description: 'Commercial & promotional content', color: '#3b82f6' },
      { id: 'storytelling', name: 'Storytelling', icon: '📖', description: 'Narrative & cinematic content', color: '#8b5cf6' },
      { id: 'tutorial', name: 'Tutorial', icon: '🎓', description: 'Educational & how-to content', color: '#10b981' },
      { id: 'vlogging', name: 'Vlogging', icon: '🎥', description: 'Personal & lifestyle content', color: '#f59e0b' },
      { id: 'street-interview', name: 'Street Interview', icon: '🎤', description: 'Urban documentary style', color: '#6366f1' },
      { id: 'tech-influencer', name: 'Tech Influencer', icon: '💻', description: 'Tech reviews & announcements', color: '#8b5cf6' },
      { id: 'mobile-game', name: 'Mobile Game', icon: '🎮', description: 'Game advertisements', color: '#ec4899' },
      { id: 'my-prompts', name: 'My Prompts', icon: '⭐', description: 'Your saved prompts', color: '#10b981' }
    ];

    // Count prompts per category
    const promptCounts = {};
    allPrompts.forEach(p => {
      promptCounts[p.category] = (promptCounts[p.category] || 0) + 1;
    });
    promptCounts['my-prompts'] = savedPrompts.length;

    mainView.innerHTML = \`
      <div class="category-grid" role="grid" aria-label="Prompt categories">
        \${categories.map(cat => \`
          <div class="category-card" 
               data-category="\${cat.id}" 
               style="border-color: \${cat.color}" 
               role="gridcell"
               tabindex="0"
               aria-label="\${cat.name} category. \${cat.description}. \${promptCounts[cat.id] || 0} prompts available."
               onclick="showPrompts('\${cat.id}')"
               onkeydown="handleCategoryKeyDown(event, '\${cat.id}')">
            <div class="category-icon" aria-hidden="true">\${cat.icon}</div>
            <div class="category-name">\${cat.name}</div>
            <div class="category-description">\${cat.description}</div>
            <div class="category-count">\${promptCounts[cat.id] || 0} prompts</div>
          </div>
        \`).join('')}
      </div>
    \`;

    updateOnboardingBanner();

    // Add click handlers
    document.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        const category = card.dataset.category;
        showPrompts(category);
      });
    });

    const setupBtn = document.getElementById('setup-api-key');
    if (setupBtn) {
      setupBtn.addEventListener('click', showSettings);
    }
  }

  // Global function for category keyboard navigation
  window.handleCategoryKeyDown = function(event, category) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showPrompts(category);
    }
  };

  function setupPromptCardListeners(categoryPrompts) {
    // Add expand/collapse functionality
    document.querySelectorAll('.prompt-card').forEach(card => {
      const header = card.querySelector('.prompt-header');
      const content = card.querySelector('.prompt-content');
      const expandIcon = card.querySelector('.expand-icon');
      
      function toggleCard() {
        const isExpanded = content.style.display !== 'none';
        content.style.display = isExpanded ? 'none' : 'block';
        expandIcon.textContent = isExpanded ? '▶' : '▼';
        header.setAttribute('aria-expanded', (!isExpanded).toString());
        card.classList.toggle('expanded', !isExpanded);
      }

      header.addEventListener('click', toggleCard);
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCard();
        }
      });
    });

    // Add action handlers
    document.querySelectorAll('.action-button').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const promptId = btn.dataset.id;
        const prompt = categoryPrompts.find(p => p.id === promptId);
        
        if (action === 'copy') {
          try {
            await navigator.clipboard.writeText(prompt.prompt);
            showToast('📋 Prompt copied to clipboard!', 'success');
          } catch (error) {
            console.error('Failed to copy:', error);
            showToast('❌ Failed to copy prompt', 'error');
          }
        } else if (action === 'preview' && prompt.youtubeLink) {
          window.open(prompt.youtubeLink, '_blank');
        } else if (action === 'save') {
          savePrompt(prompt);
        } else if (action === 'modify') {
          if (!hasApiKey) {
            showToast('🔑 Please add your OpenAI API key in settings', 'error');
            showSettings();
          } else {
            showModifyModal(prompt);
          }
        }
      });
    });
  }

  function showPrompts(category) {
    currentView = 'prompts';
    currentCategory = category;
    const mainView = document.getElementById('main-view');
    
    const categoryPrompts = category === 'my-prompts' 
      ? savedPrompts 
      : allPrompts.filter(p => p.category === category);
    
    const categoryName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    mainView.innerHTML = \`
      <div class="prompt-list" role="region" aria-labelledby="category-title">
        <button class="back-button" id="back-btn" aria-label="Back to categories">← Back</button>
        <h2 id="category-title">\${categoryName} (\${categoryPrompts.length})</h2>
        \${categoryPrompts.length === 0 ? 
          \`<div class="empty-state">
            <p>\${category === 'my-prompts' ? 'No saved prompts yet. Browse categories and save your favorites!' : 'No prompts available for this category.'}</p>
          </div>\` :
          categoryPrompts.map((prompt) => \`
            <div class="prompt-card" data-id="\${prompt.id}" role="article" aria-labelledby="prompt-title-\${prompt.id}">
              <div class="prompt-header" role="button" tabindex="0" aria-expanded="false" aria-controls="prompt-content-\${prompt.id}">
                <div class="prompt-title" id="prompt-title-\${prompt.id}">\${prompt.title}</div>
                <span class="expand-icon" aria-hidden="true">▶</span>
              </div>
              <div class="prompt-content" id="prompt-content-\${prompt.id}" style="display: none;" role="region" aria-labelledby="prompt-title-\${prompt.id}">
                <div class="prompt-text">\${prompt.prompt}</div>
                <div class="prompt-actions" role="group" aria-label="Prompt actions">
                  <button class="action-button" data-action="copy" data-id="\${prompt.id}" aria-label="Copy prompt to clipboard">📋 Copy</button>
                  <button class="action-button" data-action="modify" data-id="\${prompt.id}" aria-label="Modify prompt with AI">✏️ Modify</button>
                  \${prompt.youtubeLink ? \`<button class="action-button" data-action="preview" data-id="\${prompt.id}" aria-label="Preview example video">▶️ Preview</button>\` : ''}
                  \${category !== 'my-prompts' ? \`<button class="action-button" data-action="save" data-id="\${prompt.id}" aria-label="Save to favorites">⭐ Save</button>\` : ''}
                </div>
              </div>
            </div>
          \`).join('')
        }
      </div>
    \`;

    document.getElementById('back-btn').addEventListener('click', showCategories);
    setupPromptCardListeners(categoryPrompts);
  }

  function savePrompt(prompt) {
    const newPrompt = {
      ...prompt,
      id: \`saved-\${Date.now()}\`,
      category: 'my-prompts',
      dateAdded: new Date().toISOString()
    };
    
    savedPrompts.push(newPrompt);
    chrome.storage.local.set({ savedPrompts }, () => {
      showToast('⭐ Prompt saved to favorites!', 'success');
    });
  }

  function showModifyModal(prompt) {
    currentModifyPrompt = prompt;
    const modal = document.createElement('div');
    modal.className = 'modify-modal';
    modal.innerHTML = \`
      <div class="modify-content" role="dialog" aria-labelledby="modify-title" aria-modal="true">
        <div class="settings-header">
          <h2 id="modify-title">Modify Prompt</h2>
          <button class="close-button" id="close-modify" aria-label="Close modify dialog">✕</button>
        </div>
        <div>
          <label for="modify-instruction">How would you like to modify this prompt?</label>
          <textarea 
            id="modify-instruction" 
            class="modify-instruction" 
            placeholder="e.g., Make it more dramatic, change the setting to nighttime, add more dialogue..."
            aria-describedby="instruction-help"></textarea>
          <p id="instruction-help" style="font-size: 12px; color: #666; margin-bottom: 16px;">
            Describe the changes you want. The AI will modify the prompt while maintaining Veo 3 best practices.
          </p>
        </div>
        <div class="modify-actions">
          <button class="secondary" id="cancel-modify">Cancel</button>
          <button class="primary" id="apply-modify">✏️ Apply Changes</button>
        </div>
      </div>
    \`;
    document.body.appendChild(modal);

    // Focus management
    document.getElementById('modify-instruction').focus();

    // Event listeners
    document.getElementById('close-modify').addEventListener('click', () => {
      modal.remove();
      currentModifyPrompt = null;
    });

    document.getElementById('cancel-modify').addEventListener('click', () => {
      modal.remove();
      currentModifyPrompt = null;
    });

    document.getElementById('apply-modify').addEventListener('click', async () => {
      const instruction = document.getElementById('modify-instruction').value;
      const applyBtn = document.getElementById('apply-modify');
      
      if (!instruction.trim()) {
        showToast('📝 Please enter a modification instruction', 'error');
        return;
      }

      // Show loading state
      applyBtn.disabled = true;
      applyBtn.classList.add('loading');
      applyBtn.textContent = '';

      try {
        const modifiedPrompt = await gptService.modifyPrompt({
          prompt: prompt.prompt,
          instruction: instruction
        });

        // Create new modified prompt and save it
        const newPrompt = {
          ...prompt,
          id: \`modified-\${Date.now()}\`,
          title: \`\${prompt.title} (Modified)\`,
          prompt: modifiedPrompt,
          category: 'my-prompts',
          dateAdded: new Date().toISOString(),
          originalId: prompt.id
        };

        savedPrompts.push(newPrompt);
        await chrome.storage.local.set({ savedPrompts });

        showToast('✅ Prompt modified and saved to favorites!', 'success');
        modal.remove();
        currentModifyPrompt = null;

        // If we're in my-prompts view, refresh it
        if (currentCategory === 'my-prompts') {
          showPrompts('my-prompts');
        }
      } catch (error) {
        console.error('Modification error:', error);
        showToast(error.message, 'error');
      } finally {
        applyBtn.disabled = false;
        applyBtn.classList.remove('loading');
        applyBtn.textContent = '✏️ Apply Changes';
      }
    });

    // Close on escape key
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        currentModifyPrompt = null;
      }
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        currentModifyPrompt = null;
      }
    });
  }

  function showSettings() {
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    overlay.innerHTML = \`
      <div class="settings-modal" role="dialog" aria-labelledby="settings-title" aria-modal="true">
        <div class="settings-header">
          <h2 id="settings-title">Settings</h2>
          <button class="close-button" id="close-settings" aria-label="Close settings">✕</button>
        </div>
        <div>
          <label for="api-key-input">OpenAI API Key</label>
          <input type="password" id="api-key-input" class="api-key-input" placeholder="sk-..." aria-describedby="api-key-help">
          <p id="api-key-help" style="font-size: 12px; color: #666; margin-bottom: 16px;">
            Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Dashboard</a>
          </p>
        </div>
        <button class="primary" id="save-key">Save</button>
      </div>
    \`;
    document.body.appendChild(overlay);

    // Focus management
    document.getElementById('api-key-input').focus();

    // Load existing key
    chrome.storage.local.get(['gptApiKey'], (result) => {
      if (result.gptApiKey) {
        document.getElementById('api-key-input').value = result.gptApiKey;
      }
    });

    document.getElementById('close-settings').addEventListener('click', () => {
      overlay.remove();
    });

    document.getElementById('save-key').addEventListener('click', async () => {
      const apiKey = document.getElementById('api-key-input').value;
      await chrome.storage.local.set({ gptApiKey: apiKey });
      hasApiKey = Boolean(apiKey);
      updateApiStatus();
      updateOnboardingBanner();
      showToast(apiKey ? '✅ API key saved!' : '❌ API key removed', apiKey ? 'success' : 'info');
      overlay.remove();
      if (currentView === 'categories') {
        showCategories();
      }
    });

    // Close on escape key
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
      }
    });

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  // Initialize event listeners
  document.getElementById('settings-btn').addEventListener('click', showSettings);
  
  document.getElementById('search-btn').addEventListener('click', enterSearchMode);
  
  document.getElementById('clear-search').addEventListener('click', () => {
    exitSearchMode();
    showCategories();
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (searchQuery.trim()) {
      const results = performSearch(searchQuery);
      showSearchResults(results, searchQuery);
    } else {
      showCategories();
    }
  });

  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      exitSearchMode();
      showCategories();
    }
  });

  const setupBtn = document.getElementById('setup-api-key');
  if (setupBtn) {
    setupBtn.addEventListener('click', showSettings);
  }

  // Global function for showPrompts (called from onclick)
  window.showPrompts = showPrompts;
  
  // Load data and initialize
  await Promise.all([
    loadPrompts(),
    loadSavedPrompts(),
    checkApiKey()
  ]);
  
  showCategories();
});
`;

// Write the compiled popup
fs.writeFileSync('./dist/popup.js', popupWithReact);

console.log('✅ React-powered popup built successfully!');
console.log('Features included:');
console.log('- All 47 prompts with full React functionality');
console.log('- GPT-4o prompt modification with proper error handling');
console.log('- Search functionality with highlighting');
console.log('- Accessibility improvements (ARIA, keyboard navigation)');
console.log('- API key status indicator and onboarding');
console.log('- Enhanced loading states and error messages');
console.log('- Prompt save functionality');
console.log('- YouTube preview links');
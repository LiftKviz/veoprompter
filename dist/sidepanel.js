// Full React-powered popup with GPT-4o modification
document.addEventListener('DOMContentLoaded', async () => {
  // GPT Service for prompt modification
  class GPTService {
    constructor() {
      this.apiKey = null;
      this.knowledgeBase = null;
      this.secureStorage = new SecureStorage();
    }

    static getInstance() {
      if (!GPTService.instance) {
        GPTService.instance = new GPTService();
      }
      return GPTService.instance;
    }

    async getApiKey() {
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

    async setApiKey(apiKey) {
      if (!apiKey) {
        await this.secureStorage.removeApiKey();
        this.apiKey = null;
        return true;
      }

      try {
        await this.secureStorage.storeApiKey(apiKey);
        this.apiKey = apiKey;
        return true;
      } catch (error) {
        console.error('Failed to store API key:', error);
        throw error;
      }
    }

    async hasApiKey() {
      return await this.secureStorage.hasApiKey();
    }

    async modifyPrompt(request) {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        throw new Error('🔑 API key required: Please add your OpenAI API key in settings to use prompt modification features.');
      }

      if (!request.instruction?.trim()) {
        throw new Error('📝 Modification instruction required: Please describe how you want to modify the prompt.');
      }

      const systemPrompt = `You are an expert AI prompt engineer specializing in Google Veo 3. Transform ideas into prompts using the SSASA framework:

1) SUBJECT: Clearly identify who/what is the focus with specific details (e.g., 'grizzled detective in rumpled trench coat' not 'a man')
2) SCENE: Describe environment in detail - where and when action occurs (e.g., 'dusty attic with afternoon light through grimy window')
3) ACTION: Define what subject is doing with strong verbs, chain actions with 'this happens, then that happens'
4) STYLE: Specify visual aesthetic (e.g., '1990s VHS footage', '8-bit video game', 'claymation', 'filmed on 16mm')
5) AUDIO: Explicitly describe all sounds - dialogue, ambient sounds, SFX, and music (Veo 3's signature feature)
6) CAMERA: Specify camera movements and shots (e.g., 'dolly in', 'handheld', 'aerial view', 'close-up', 'tracking shot')

For dialogue, use format: "Character Name says (with emotional tone): 'Exact words.'" - This prevents mixing up speakers.

Include negative prompt (no subtitles, no on-screen text) unless requested. Keep modifications concise and focused on the user's instruction while maintaining Veo 3 best practices.

IMPORTANT: Always output your response in JSON format: {"prompt": "your enhanced prompt here"}`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
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
                content: `Original prompt: "${request.prompt}"

Modification instruction: "${request.instruction}"

Please modify the prompt according to the instruction using the SSASA framework.`
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
            throw new Error('🔐 Invalid API key: Please check your OpenAI API key in settings and ensure it\'s valid.');
          } else if (response.status === 403) {
            throw new Error('🚫 Access denied: Your API key doesn\'t have permission to access GPT-4. Please check your OpenAI account.');
          } else if (response.status === 429) {
            throw new Error('⏰ Rate limit exceeded: Please wait a moment and try again. Consider upgrading your OpenAI plan for higher limits.');
          } else if (response.status === 500) {
            throw new Error('🔧 OpenAI server error: Please try again in a few moments.');
          } else if (response.status >= 400 && response.status < 500) {
            throw new Error(`❌ Request error: ${errorMessage || 'Please check your request and try again.'}`);
          } else {
            throw new Error(`🌐 Network error: ${errorMessage || 'Please check your internet connection and try again.'}`);
          }
        }

        const data = await response.json();
        
        if (!data.choices?.[0]?.message?.content) {
          throw new Error('📭 Empty response: The AI didn\'t generate a response. Please try again with a different instruction.');
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

  // HTML structure
  document.body.innerHTML = `
    <div class="app">
      <header class="header">
        <div class="header-content">
          <div class="header-top">
            <div class="header-left">
              <img src="icons/logo.png" alt="Logo" class="header-logo" />
            </div>
            <div class="header-right">
              <div class="api-status">
                <span id="status-indicator" class="status-indicator">⚪</span>
              </div>
              <button id="settings-btn" class="icon-button">⚙️</button>
            </div>
          </div>
          <div class="search-field-container">
            <div class="search-field">
              <div class="search-icon">🔍</div>
              <input type="text" id="search-input" class="search-input" placeholder="Search prompts..." />
              <button id="clear-search" class="clear-button" style="display: none;">✕</button>
            </div>
          </div>
          <div class="header-actions">
            <button id="sequences-btn" class="action-button">
              <span class="action-icon">🎬</span>
              <span class="action-text">Sequences</span>
            </button>
            <button id="custom-prompt-btn" class="action-button custom-prompt">
              <span class="action-icon">💫</span>
              <span class="action-text">Custom Prompt</span>
            </button>
          </div>
        </div>
      </header>
      <main class="app-content">
        <div id="main-view"></div>
      </main>
    </div>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        width: 100%; 
        height: 100vh; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: #111113;
        background: #ffffff;
        overflow: hidden;
      }
      .app { height: 100%; display: flex; flex-direction: column; }
      .header {
        background: #ffffff;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        padding: 16px;
      }
      .header-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .header-logo {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        border-radius: 8px;
      }
      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .search-field-container {
        width: 100%;
      }
      .search-field {
        display: flex;
        align-items: center;
        background: #F3F5F7;
        border-radius: 15px;
        padding: 10px 12px;
        gap: 8px;
        box-shadow: 0px 1.5px 3px rgba(0, 0, 0, 0.25);
      }
      .search-icon {
        font-size: 14px;
        opacity: 0.6;
      }
      .search-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 12px;
        font-weight: 500;
        color: #111113;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .search-input::placeholder {
        color: rgba(17, 17, 19, 0.6);
      }
      .clear-button {
        background: none;
        border: none;
        color: rgba(17, 17, 19, 0.6);
        cursor: pointer;
        padding: 0;
        font-size: 14px;
      }
      .header-actions {
        display: flex;
        gap: 8px;
      }
      .action-button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px;
        background: #252525;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .action-button:hover {
        background: #1a1a1a;
      }
      .action-button.custom-prompt {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .action-button.custom-prompt:hover {
        opacity: 0.9;
      }
      .action-icon {
        font-size: 16px;
      }
      .action-text {
        font-size: 13px;
        font-weight: 500;
        color: #ffffff;
      }
      .search-container {
        display: flex;
        align-items: center;
        background: #2a2a2a;
        border: 1px solid #404040;
        border-radius: 20px;
        padding: 4px 8px;
      }
      .search-input {
        border: none;
        background: transparent;
        outline: none;
        padding: 4px 8px;
        font-size: 14px;
        width: 150px;
        color: #e0e0e0;
      }
      .search-input::placeholder {
        color: #b0b0b0;
      }
      .icon-button {
        background: transparent;
        border: none;
        padding: 6px;
        cursor: pointer;
        border-radius: 4px;
        font-size: 16px;
      }
      .icon-button:hover { background: #404040; }
      .status-indicator.connected { color: #22c55e; }
      .status-indicator.disconnected { color: #ef4444; }
      .app-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 12px;
        display: flex;
        flex-direction: column;
      }
      /* Thin autohide scrollbar */
      .app-content::-webkit-scrollbar {
        width: 4px;
      }
      .app-content::-webkit-scrollbar-track {
        background: transparent;
      }
      .app-content::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 2px;
        transition: background 0.2s;
      }
      .app-content:hover::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.3);
      }
      .app-content::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.4);
      }
      #main-view {
        flex: 1;
        overflow: visible;
      }
      .category-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        height: 100%;
        align-content: start;
      }
      .category-card {
        background: #2a2a2a;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        padding: 8px;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s;
      }
      .category-card:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .category-icon {
        font-size: 24px;
        margin-bottom: 4px;
      }
      .category-name {
        font-weight: 500;
        margin-bottom: 2px;
        font-size: 14px;
      }
      .category-description {
        font-size: 11px;
        color: #d0d0d0;
        line-height: 1.2;
      }
      .category-count {
        font-size: 10px;
        color: #b0b0b0;
        margin-top: 2px;
      }
      .prompt-list {
        background: #2a2a2a;
        border-radius: 8px;
        padding: 12px;
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .back-button {
        background: transparent;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: #3b82f6;
        font-size: 14px;
        margin-bottom: 16px;
      }
      .prompt-card {
        background: #2a2a2a;
        border: 1px solid #404040;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .prompt-card:hover {
        background: #333333;
        border-color: #3b82f6;
      }
      .prompt-card.expanded {
        background: #2a2a2a;
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
        color: #d0d0d0;
      }
      .prompt-content {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e0e0e0;
      }
      .prompt-text {
        font-size: 13px;
        line-height: 1.5;
        color: #c0c0c0;
        margin-bottom: 12px;
        white-space: pre-wrap;
        max-height: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .prompt-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
      }
      .action-button {
        background: #2a2a2a;
        border: 1px solid #404040;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 13px;
        color: #e0e0e0;
        transition: all 0.2s;
        position: relative;
      }
      .action-button:hover {
        background: #404040;
        border-color: #3b82f6;
      }
      .action-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .action-button.loading {
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
        background: #2a2a2a;
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
      }
      .api-key-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #404040;
        border-radius: 4px;
        margin-bottom: 16px;
        font-family: monospace;
        font-size: 13px;
      }
      .primary {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }
      .primary:hover { background: #2563eb; }
      .secondary {
        background: #2a2a2a;
        color: #ffffff;
        border: 1px solid #404040;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }
      .secondary:hover { background: #f8f9fa; }
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
        color: #d0d0d0;
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
      .toast.error { background: #dc2626; }
      .toast.success { background: #16a34a; }
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
        background: #2a2a2a;
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
        border: 1px solid #404040;
        border-radius: 4px;
        margin-bottom: 16px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
      }
      .modify-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      .search-results {
        margin-bottom: 16px;
        font-size: 14px;
        color: #d0d0d0;
      }
      .highlight {
        background: #fef3c7;
        padding: 1px 2px;
        border-radius: 2px;
      }
      .sequence-builder {
        background: #2a2a2a;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }
      .sequence-item {
        background: #2a2a2a;
        border: 1px solid #404040;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 8px;
        position: relative;
      }
      .sequence-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .sequence-number {
        font-weight: 500;
        color: #3b82f6;
      }
      .sequence-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .sequence-list {
        display: grid;
        gap: 12px;
      }
      .sequence-card {
        background: #2a2a2a;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .sequence-card:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .sequence-title {
        font-weight: 500;
        margin-bottom: 8px;
      }
      .sequence-preview {
        font-size: 12px;
        color: #d0d0d0;
        margin-bottom: 8px;
      }
      .sequence-length {
        font-size: 11px;
        color: #b0b0b0;
      }
      .add-to-sequence {
        background: #8b5cf6;
        color: white;
      }
      .add-to-sequence:hover {
        background: #7c3aed;
      }
      .sequence-prompt-card {
        margin-bottom: 12px;
        border: 1px solid #404040;
        border-radius: 8px;
        background: #2a2a2a;
      }
      .sequence-prompt-card .prompt-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 12px 16px 8px 16px;
        border-bottom: 1px solid #f0f0f0;
      }
      .sequence-prompt-card .prompt-title-section {
        flex: 1;
      }
      .sequence-prompt-card .sequence-number {
        display: inline-block;
        background: #3b82f6;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        margin-bottom: 4px;
      }
      .sequence-prompt-card .sequence-remove {
        background: #fee2e2;
        color: #dc2626;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .sequence-prompt-card .sequence-remove:hover {
        background: #fecaca;
      }
      .sequence-prompt-card .prompt-content {
        padding: 0 16px 12px 16px;
      }
      .sequence-prompt-card .prompt-actions {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #f0f0f0;
      }
      .sequence-builder-empty {
        text-align: center;
        padding: 20px;
        color: #d0d0d0;
        font-size: 13px;
      }
      .sequence-builder-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .sequence-builder-title {
        font-weight: 500;
      }
      .sequence-remove {
        background: transparent;
        border: none;
        color: #dc2626;
        cursor: pointer;
        padding: 4px;
        font-size: 16px;
      }
      .sequence-remove:hover {
        background: #fee2e2;
        border-radius: 4px;
      }
    </style>
  `;

  // State
  let hasApiKey = false;
  let currentView = 'categories';
  let currentCategory = null;
  let allPrompts = [];
  let savedPrompts = [];
  let savedSequences = [];
  let searchMode = false;
  let searchQuery = '';
  let sequenceBuilder = [];

  // Load prompts from Firebase or file
  async function loadPrompts() {
    try {
      // Check if Firebase is enabled
      if (typeof simpleFirebaseService !== 'undefined' && await simpleFirebaseService.isFirebaseEnabled()) {
        try {
          // Subscribe to Firebase updates
          await simpleFirebaseService.subscribeToPrompts((prompts) => {
            allPrompts = prompts.map((prompt, index) => ({
              ...prompt,
              id: prompt.id || `prompt-${index}`
            }));
            
            // Refresh current view if needed
            if (currentView === 'prompts' && currentCategory) {
              showPrompts(currentCategory);
            } else if (currentView === 'search' && searchQuery) {
              const results = performSearch(searchQuery);
              showSearchResults(results, searchQuery);
            }
            
            // Update category view if showing
            if (currentView === 'categories') {
              showCategories();
            }
          });
          
          // Show loading indicator
          showToast('🔄 Connected to Firebase!', 'success');
          return;
        } catch (error) {
          console.error('Firebase connection failed:', error);
          showToast('⚠️ Firebase unavailable, using local prompts', 'info');
        }
      }
      
      // Fallback to loading from file
      const response = await fetch(chrome.runtime.getURL('data/prompts.txt'));
      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      allPrompts = lines.map((line, index) => {
        const [category, title, prompt, youtubeLink] = line.split('|');
        return {
          id: `prompt-${index}`,
          category: category?.trim(),
          title: title?.trim(),
          prompt: prompt?.trim(),
          youtubeLink: youtubeLink?.trim()
        };
      }).filter(p => p.category && p.title && p.prompt);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      showToast('❌ Failed to load prompts', 'error');
    }
  }

  // Load saved prompts from storage
  async function loadSavedPrompts() {
    const result = await chrome.storage.local.get(['savedPrompts']);
    savedPrompts = result.savedPrompts || [];
  }

  // Load saved sequences from storage
  async function loadSavedSequences() {
    const result = await chrome.storage.local.get(['savedSequences']);
    savedSequences = result.savedSequences || [];
  }

  // Check API key status
  async function checkApiKey() {
    try {
      hasApiKey = await gptService.hasApiKey();
      updateApiStatus();
      updateOnboardingBanner();
    } catch (error) {
      console.error('Failed to check API key:', error);
      hasApiKey = false;
      updateApiStatus();
      updateOnboardingBanner();
    }
  }

  function updateApiStatus() {
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
      indicator.textContent = hasApiKey ? '🟢' : '🔴';
      indicator.className = `status-indicator ${hasApiKey ? 'connected' : 'disconnected'}`;
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
    toast.className = `toast ${type}`;
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
    
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      return text.replace(regex, '<span class="highlight">$1</span>');
    } catch (error) {
      return text; // Return original text if regex fails
    }
  }

  function showSearchResults(results, query) {
    currentView = 'search';
    const mainView = document.getElementById('main-view');
    
    mainView.innerHTML = `
      <div class="prompt-list">
        <button class="back-button" id="back-btn">← Back</button>
        <h2>Search Results</h2>
        <div class="search-results">${results.length} prompt${results.length !== 1 ? 's' : ''} found for "${query}"</div>
        ${results.length === 0 ? 
          `<div class="empty-state">
            <p>No prompts found matching your search. Try different keywords.</p>
          </div>` :
          results.map((prompt) => `
            <div class="prompt-card" data-id="${prompt.id}">
              <div class="prompt-header">
                <div class="prompt-title">${highlightText(prompt.title, query)}</div>
                <span class="expand-icon">▶</span>
              </div>
              <div class="prompt-content" style="display: none;">
                <div class="prompt-text">${highlightText(prompt.prompt, query)}</div>
                <div class="prompt-actions">
                  <button class="action-button" data-action="copy" data-id="${prompt.id}">📋 Copy</button>
                  <button class="action-button" data-action="modify" data-id="${prompt.id}">✏️ Modify</button>
                  <button class="action-button" data-action="preview" data-id="${prompt.id}">▶️ Preview</button>
                  ${!savedPrompts.find(sp => sp.id === prompt.id || sp.title === prompt.title) ? `<button class="action-button" data-action="save" data-id="${prompt.id}">⭐ Save</button>` : ''}
                  <button class="action-button add-to-sequence" data-action="add-sequence" data-id="${prompt.id}">🎬 Add to Sequence</button>
                </div>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;

    setupPromptCardListeners(results);
    document.getElementById('back-btn').addEventListener('click', () => {
      exitSearchMode();
      showCategories();
    });
    
    // Update tier-restricted elements after rendering
    setTimeout(updateTierRestrictedElements, 50);
  }

  function enterSearchMode() {
    searchMode = true;
    document.getElementById('search-input').focus();
  }

  function exitSearchMode() {
    searchMode = false;
    searchQuery = '';
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').style.display = 'none';
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

    mainView.innerHTML = `
      <div class="category-grid">
        ${categories.map(cat => `
          <div class="category-card" data-category="${cat.id}" style="border-color: ${cat.color}">
            <div class="category-icon">${cat.icon}</div>
            <div class="category-name">${cat.name}</div>
            <div class="category-description">${cat.description}</div>
            <div class="category-count">${promptCounts[cat.id] || 0} prompts</div>
          </div>
        `).join('')}
      </div>
    `;

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

  function setupPromptCardListeners(categoryPrompts) {
    // Clear existing listeners to prevent duplicates
    const existingCards = document.querySelectorAll('.prompt-card');
    existingCards.forEach(card => {
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);
    });

    // Debounce mechanism for rapid clicks
    let clickTimeout = null;

    // Add expand/collapse functionality to fresh cards
    document.querySelectorAll('.prompt-card').forEach(card => {
      const header = card.querySelector('.prompt-header');
      const content = card.querySelector('.prompt-content');
      const expandIcon = card.querySelector('.expand-icon');
      
      if (header && content && expandIcon) {
        header.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          // Debounce rapid clicks
          if (clickTimeout) return;
          clickTimeout = setTimeout(() => clickTimeout = null, 300);
          
          const isExpanded = content.style.display !== 'none';
          content.style.display = isExpanded ? 'none' : 'block';
          expandIcon.textContent = isExpanded ? '▶' : '▼';
          card.classList.toggle('expanded', !isExpanded);
        });
      }
    });

    // Add action handlers to fresh buttons
    document.querySelectorAll('.action-button').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Add visual feedback immediately
        btn.style.opacity = '0.6';
        setTimeout(() => btn.style.opacity = '1', 150);
        
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
        } else if (action === 'preview') {
          if (prompt.youtubeLink) {
            window.open(prompt.youtubeLink, '_blank');
          } else {
            showToast('🎬 Preview video coming soon!', 'info');
          }
        } else if (action === 'save') {
          savePrompt(prompt);
        } else if (action === 'modify') {
          if (!hasApiKey) {
            showToast('🔑 Please add your OpenAI API key in settings', 'error');
            showSettings();
          } else {
            showModifyModal(prompt);
          }
        } else if (action === 'add-sequence') {
          addToSequence(prompt);
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

    // Limit prompts to first 4 to fit without scrolling
    const visiblePrompts = categoryPrompts.slice(0, 4);
    const hasMore = categoryPrompts.length > 4;
    
    mainView.innerHTML = `
      <div class="prompt-list">
        <button class="back-button" id="back-btn">← Back</button>
        <h2>${categoryName} (${categoryPrompts.length})</h2>
        ${categoryPrompts.length === 0 ? 
          `<div class="empty-state">
            <p>${category === 'my-prompts' ? 'No saved prompts yet. Browse categories and save your favorites!' : 'No prompts available for this category.'}</p>
          </div>` :
          visiblePrompts.map((prompt) => `
            <div class="prompt-card" data-id="${prompt.id}">
              <div class="prompt-header">
                <div class="prompt-title">${prompt.title}</div>
                <span class="expand-icon">▶</span>
              </div>
              <div class="prompt-content" style="display: none;">
                <div class="prompt-text">${prompt.prompt}</div>
                <div class="prompt-actions">
                  <button class="action-button" data-action="copy" data-id="${prompt.id}">📋 Copy</button>
                  <button class="action-button" data-action="modify" data-id="${prompt.id}">✏️ Modify</button>
                  <button class="action-button" data-action="preview" data-id="${prompt.id}">▶️ Preview</button>
                  ${category !== 'my-prompts' ? `<button class="action-button" data-action="save" data-id="${prompt.id}">⭐ Save</button>` : ''}
                  <button class="action-button add-to-sequence" data-action="add-sequence" data-id="${prompt.id}">🎬 Add to Sequence</button>
                </div>
              </div>
            </div>
          `).join('')
        }
        ${hasMore ? `
          <div class="show-more-indicator" style="
            text-align: center;
            padding: 8px;
            color: #b0b0b0;
            font-size: 12px;
            border-top: 1px solid #404040;
            margin-top: 8px;
          ">
            +${categoryPrompts.length - 4} more prompts (expand cards to see all)
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('back-btn').addEventListener('click', showCategories);
    setupPromptCardListeners(visiblePrompts);
    
    // Update tier-restricted elements after rendering
    setTimeout(updateTierRestrictedElements, 50);
  }

  function savePrompt(prompt) {
    const newPrompt = {
      ...prompt,
      id: `saved-${Date.now()}`,
      category: 'my-prompts',
      dateAdded: new Date().toISOString()
    };
    
    savedPrompts.push(newPrompt);
    chrome.storage.local.set({ savedPrompts }, () => {
      showToast('⭐ Prompt saved to favorites!', 'success');
    });
  }

  function showModifyModal(prompt) {
    const modal = document.createElement('div');
    modal.className = 'modify-modal';
    modal.innerHTML = `
      <div class="modify-content">
        <div class="settings-header">
          <h2>Modify Prompt</h2>
          <button class="close-button" id="close-modify">✕</button>
        </div>
        <div>
          <label>How would you like to modify this prompt?</label>
          <textarea id="modify-instruction" class="modify-instruction" placeholder="e.g., Make it more dramatic, change the setting to nighttime, add more dialogue..."></textarea>
          <p style="font-size: 12px; color: #b0b0b0; margin-bottom: 16px;">
            Describe the changes you want. The AI will modify the prompt while maintaining Veo 3 best practices.
          </p>
        </div>
        <div class="modify-actions">
          <button class="secondary" id="cancel-modify">Cancel</button>
          <button class="primary" id="apply-modify">✏️ Apply Changes</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('modify-instruction').focus();

    document.getElementById('close-modify').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('cancel-modify').addEventListener('click', () => {
      modal.remove();
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
      const originalText = applyBtn.textContent;
      applyBtn.textContent = '';

      try {
        const modifiedPrompt = await gptService.modifyPrompt({
          prompt: prompt.prompt,
          instruction: instruction
        });

        // Create new modified prompt and save it
        const newPrompt = {
          ...prompt,
          id: `modified-${Date.now()}`,
          title: `${prompt.title} (Modified)`,
          prompt: modifiedPrompt,
          category: 'my-prompts',
          dateAdded: new Date().toISOString(),
          originalId: prompt.id
        };

        savedPrompts.push(newPrompt);
        await chrome.storage.local.set({ savedPrompts });

        showToast('✅ Prompt modified and saved to favorites!', 'success');
        modal.remove();

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
        applyBtn.textContent = originalText;
      }
    });

    // Close on escape key
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.remove();
      }
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  function showSettings() {
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    overlay.innerHTML = `
      <div class="settings-modal">
        <div class="settings-header">
          <h2>Settings</h2>
          <button class="close-button" id="close-settings">✕</button>
        </div>
        <div>
          <label>OpenAI API Key</label>
          <input type="password" id="api-key-input" class="api-key-input" placeholder="sk-...">
          <p style="font-size: 12px; color: #b0b0b0; margin-bottom: 16px;">
            Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Dashboard</a>
          </p>
        </div>
        <button class="primary" id="save-key">Save</button>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('api-key-input').focus();

    // Load existing key (show masked version for security)
    gptService.getApiKey().then(apiKey => {
      if (apiKey) {
        // Show masked version for security
        const maskedKey = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
        document.getElementById('api-key-input').placeholder = `Current: ${maskedKey}`;
      }
    }).catch(error => {
      console.error('Failed to load API key:', error);
    });

    document.getElementById('close-settings').addEventListener('click', () => {
      overlay.remove();
    });

    document.getElementById('save-key').addEventListener('click', async () => {
      const apiKey = document.getElementById('api-key-input').value.trim();
      
      try {
        if (apiKey) {
          // Validate API key format
          if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
            showToast('❌ Invalid API key format. Please check your key.', 'error');
            return;
          }
          
          await gptService.setApiKey(apiKey);
          
          // Upgrade user to BYOK tier automatically when they add an API key
          const tierService = window.tierService;
          if (tierService) {
            try {
              await tierService.upgradeToBYOK(apiKey);
              showToast('✅ API key saved! You now have BYOK access to all features!', 'success');
            } catch (error) {
              console.error('Failed to upgrade to BYOK:', error);
              showToast('✅ API key saved, but tier upgrade failed. Please try again.', 'warning');
            }
          } else {
            showToast('✅ API key encrypted and saved securely!', 'success');
          }
        } else {
          await gptService.setApiKey(null);
          
          // Downgrade to free tier when API key is removed
          const tierService = window.tierService;
          if (tierService) {
            await tierService.setUserTier('free', null);
          }
          
          showToast('❌ API key removed - reverted to free tier', 'info');
        }
        
        hasApiKey = Boolean(apiKey);
        updateApiStatus();
        updateOnboardingBanner();
        overlay.remove();
        
        if (currentView === 'categories') {
          showCategories();
        }
      } catch (error) {
        console.error('Failed to save API key:', error);
        showToast('❌ Failed to save API key: ' + error.message, 'error');
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

  // Sequence management functions
  function addToSequence(prompt) {
    // Add prompt to sequence builder
    const sequenceItem = {
      ...prompt,
      sequenceId: `seq-${Date.now()}`,
      sequenceOrder: sequenceBuilder.length + 1
    };
    
    sequenceBuilder.push(sequenceItem);
    showToast(`🎬 Added "${prompt.title}" to sequence (${sequenceBuilder.length} prompts)`, 'success');
    
    // Show sequence builder if not already visible
    if (currentView !== 'sequences') {
      updateSequenceIndicator();
    }
  }

  function updateSequenceIndicator() {
    const sequencesBtn = document.getElementById('sequences-btn');
    if (sequencesBtn && sequenceBuilder.length > 0) {
      sequencesBtn.innerHTML = `🎬 <span style="background: #dc2626; color: white; border-radius: 50%; padding: 0 4px; font-size: 10px; position: absolute; top: 0; right: 0;">${sequenceBuilder.length}</span>`;
      sequencesBtn.style.position = 'relative';
    }
  }

  function showCustomPromptInterface() {
    currentView = 'custom-prompt';
    const mainView = document.getElementById('main-view');
    
    mainView.innerHTML = `
      <div class="custom-prompt-container">
        <button class="back-button" id="back-btn">← Back</button>
        <h2>💫 Custom Prompt</h2>
        <div class="custom-prompt-form">
          <label for="custom-prompt-input">Enter your custom prompt:</label>
          <textarea id="custom-prompt-input" class="custom-prompt-textarea" 
                    placeholder="Describe what you want to create..." 
                    rows="6"></textarea>
          <button id="generate-custom" class="primary-button">Generate</button>
        </div>
      </div>
      <style>
        .custom-prompt-container {
          padding: 16px;
        }
        .custom-prompt-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }
        .custom-prompt-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          background: #F3F5F7;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
        }
        .primary-button {
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .primary-button:hover {
          opacity: 0.9;
        }
      </style>
    `;
    
    document.getElementById('back-btn').addEventListener('click', showCategories);
    document.getElementById('generate-custom').addEventListener('click', () => {
      const customPrompt = document.getElementById('custom-prompt-input').value;
      if (customPrompt) {
        // Handle custom prompt generation
        console.log('Custom prompt:', customPrompt);
      }
    });
  }

  function showSequences() {
    currentView = 'sequences';
    const mainView = document.getElementById('main-view');
    
    mainView.innerHTML = `
      <div class="prompt-list">
        <button class="back-button" id="back-btn">← Back</button>
        <h2>Sequences</h2>
        
        ${sequenceBuilder.length > 0 ? `
          <div class="sequence-builder">
            <div class="sequence-builder-header">
              <h3 class="sequence-builder-title">Current Sequence (${sequenceBuilder.length} prompts)</h3>
              <div>
                <button class="primary" id="save-sequence">💾 Save Sequence</button>
                <button class="secondary" id="clear-sequence">🗑️ Clear</button>
              </div>
            </div>
            <div class="sequence-list">
              ${sequenceBuilder.map((item, index) => `
                <div class="prompt-card sequence-prompt-card" data-sequence-id="${item.sequenceId}">
                  <div class="prompt-header">
                    <div class="prompt-title-section">
                      <span class="sequence-number">Scene ${index + 1}</span>
                      <div class="prompt-title">${item.title}</div>
                    </div>
                    <button class="sequence-remove" data-sequence-id="${item.sequenceId}" title="Remove from sequence">×</button>
                  </div>
                  
                  <div class="prompt-content">
                    <div class="prompt-text ${item.expanded ? 'expanded' : ''}" data-sequence-id="${item.sequenceId}">
                      ${item.expanded ? item.prompt : item.prompt.substring(0, 150) + '...'}
                    </div>
                    
                    <div class="prompt-actions">
                      <div class="action-buttons">
                        <button class="action-button" data-action="copy" data-id="${item.sequenceId}" title="Copy prompt">📋 Copy</button>
                        <button class="action-button" data-action="modify" data-id="${item.sequenceId}" title="Modify prompt">✏️ Modify</button>
                        <button class="toggle-expand" data-sequence-id="${item.sequenceId}">
                          ${item.expanded ? '📄 Show Less' : '📄 Show More'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="margin-top: 12px; text-align: center;">
              <button class="primary" id="add-next-scene" style="margin-bottom: 12px;">➕ Add Next Scene</button>
            </div>
            <div style="margin-top: 12px; padding: 12px; background: #333333; border-radius: 6px;">
              <p style="font-size: 13px; color: #b0b0b0; margin-bottom: 8px;">
                <strong>Tip:</strong> Create video sequences using the "this then that" technique. Each prompt builds on the previous one for smooth transitions.
              </p>
              <button class="action-button" id="copy-sequence">📋 Copy All as Single Prompt</button>
            </div>
          </div>
        ` : `
          <div class="sequence-builder">
            <div class="sequence-builder-empty">
              <p>No prompts in sequence yet.</p>
              <p>Browse categories and click "Add to Sequence" to build a video sequence.</p>
            </div>
          </div>
        `}
        
        ${savedSequences.length > 0 ? `
          <h3 style="margin-top: 24px; margin-bottom: 16px;">Saved Sequences</h3>
          <div class="sequence-list">
            ${savedSequences.map(seq => `
              <div class="sequence-card" data-sequence-id="${seq.id}">
                <div class="sequence-title">${seq.title}</div>
                <div class="sequence-preview">${seq.prompts.length} prompts</div>
                <div class="sequence-preview" style="margin-bottom: 8px;">
                  ${seq.prompts.map(p => p.title).join(' → ')}
                </div>
                <div class="sequence-actions">
                  <button class="action-button" data-action="load-sequence" data-id="${seq.id}">📥 Load</button>
                  <button class="action-button" data-action="copy-sequence" data-id="${seq.id}">📋 Copy</button>
                  <button class="action-button" data-action="delete-sequence" data-id="${seq.id}" style="color: #dc2626;">🗑️ Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    // Add event handlers
    document.getElementById('back-btn').addEventListener('click', showCategories);
    
    if (sequenceBuilder.length > 0) {
      document.getElementById('save-sequence').addEventListener('click', saveSequence);
      document.getElementById('clear-sequence').addEventListener('click', () => {
        if (confirm('Clear all prompts from the current sequence?')) {
          sequenceBuilder = [];
          updateSequenceIndicator();
          showSequences();
        }
      });
      
      document.getElementById('add-next-scene').addEventListener('click', () => {
        if (!hasApiKey) {
          showToast('🔑 Please add your OpenAI API key in settings', 'error');
          showSettings();
        } else {
          showAddNextSceneModal();
        }
      });
      
      document.getElementById('copy-sequence').addEventListener('click', copySequenceAsPrompt);
      
      // Handle sequence item actions (copy, modify, expand)
      document.querySelectorAll('.sequence-prompt-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          const sequenceId = e.target.dataset.id || e.target.dataset.sequenceId;
          const sequenceItem = sequenceBuilder.find(item => item.sequenceId === sequenceId);
          
          if (!sequenceItem) return;
          
          if (action === 'copy') {
            e.stopPropagation();
            navigator.clipboard.writeText(sequenceItem.prompt);
            showToast('📋 Prompt copied to clipboard!', 'success');
          } else if (action === 'modify') {
            e.stopPropagation();
            if (!hasApiKey) {
              showToast('🔑 Please add your OpenAI API key in settings', 'error');
              showSettings();
            } else {
              showModifySequenceModal(sequenceItem);
            }
          } else if (e.target.classList.contains('toggle-expand')) {
            e.stopPropagation();
            // Toggle expanded state
            const item = sequenceBuilder.find(item => item.sequenceId === sequenceId);
            if (item) {
              item.expanded = !item.expanded;
              showSequences(); // Refresh view
            }
          }
        });
      });

      document.querySelectorAll('.sequence-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const sequenceId = e.target.dataset.sequenceId;
          sequenceBuilder = sequenceBuilder.filter(item => item.sequenceId !== sequenceId);
          updateSequenceIndicator();
          showSequences();
        });
      });
    }
    
    // Saved sequences actions
    document.querySelectorAll('.sequence-card .action-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const sequenceId = e.target.dataset.id;
        const sequence = savedSequences.find(s => s.id === sequenceId);
        
        if (action === 'load-sequence') {
          sequenceBuilder = sequence.prompts.map((p, i) => ({
            ...p,
            sequenceId: `seq-${Date.now()}-${i}`,
            sequenceOrder: i + 1
          }));
          updateSequenceIndicator();
          showToast(`📥 Loaded sequence "${sequence.title}"`, 'success');
          showSequences();
        } else if (action === 'copy-sequence') {
          const combinedPrompt = sequence.prompts.map((p, i) => 
            `[Scene ${i + 1}] ${p.prompt}`
          ).join('\n\n');
          navigator.clipboard.writeText(combinedPrompt);
          showToast('📋 Sequence copied to clipboard!', 'success');
        } else if (action === 'delete-sequence') {
          if (confirm(`Delete sequence "${sequence.title}"?`)) {
            savedSequences = savedSequences.filter(s => s.id !== sequenceId);
            chrome.storage.local.set({ savedSequences });
            showToast('🗑️ Sequence deleted', 'info');
            showSequences();
          }
        }
      });
    });
  }

  function saveSequence() {
    const title = prompt('Enter a name for this sequence:');
    if (!title) return;
    
    const newSequence = {
      id: `sequence-${Date.now()}`,
      title: title.trim(),
      prompts: [...sequenceBuilder],
      dateCreated: new Date().toISOString()
    };
    
    savedSequences.push(newSequence);
    chrome.storage.local.set({ savedSequences }, () => {
      showToast(`💾 Sequence "${title}" saved!`, 'success');
      sequenceBuilder = [];
      updateSequenceIndicator();
      showSequences();
    });
  }

  function copySequenceAsPrompt() {
    const combinedPrompt = sequenceBuilder.map((item, index) => 
      `[Scene ${index + 1}] ${item.prompt}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(combinedPrompt);
    showToast('📋 Sequence copied as single prompt!', 'success');
  }

  function showAddNextSceneModal() {
    const lastPrompt = sequenceBuilder[sequenceBuilder.length - 1];
    if (!lastPrompt) return;

    const modal = document.createElement('div');
    modal.className = 'modify-modal';
    modal.innerHTML = `
      <div class="modify-content">
        <div class="settings-header">
          <h2>Add Next Scene</h2>
          <button class="close-button" id="close-add-scene">✕</button>
        </div>
        
        <div style="margin-bottom: 16px; padding: 12px; background: #333333; border-radius: 6px;">
          <h4 style="margin-bottom: 8px; color: #ffffff;">Previous Scene:</h4>
          <div style="font-size: 13px; color: #b0b0b0; max-height: 100px; overflow-y: auto;">
            <strong>${lastPrompt.title}</strong><br>
            ${lastPrompt.prompt.substring(0, 200)}...
          </div>
        </div>
        
        <div>
          <label>What happens next in your sequence?</label>
          <textarea id="next-scene-instruction" class="modify-instruction" placeholder="e.g., Camera cuts to the character's reaction, The scene shifts to nighttime, A new character enters..."></textarea>
          <p style="font-size: 12px; color: #b0b0b0; margin-bottom: 16px;">
            Describe what happens in the next scene. The AI will create a new prompt that continues naturally from the previous scene.
          </p>
        </div>
        
        <div class="settings-actions">
          <button type="button" class="secondary" id="cancel-add-scene">Cancel</button>
          <button type="button" class="primary" id="generate-next-scene">✨ Generate Next Scene</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    // Focus on textarea
    const textarea = modal.querySelector('#next-scene-instruction');
    textarea.focus();

    // Close button
    modal.querySelector('#close-add-scene').addEventListener('click', () => {
      modal.remove();
    });

    // Cancel button
    modal.querySelector('#cancel-add-scene').addEventListener('click', () => {
      modal.remove();
    });

    // Generate next scene
    modal.querySelector('#generate-next-scene').addEventListener('click', async () => {
      const instruction = textarea.value.trim();
      if (!instruction) {
        showToast('Please describe what happens next', 'error');
        return;
      }

      const generateBtn = modal.querySelector('#generate-next-scene');
      generateBtn.disabled = true;
      generateBtn.classList.add('loading');
      const originalText = generateBtn.textContent;
      generateBtn.textContent = '';

      try {
        const gptService = GPTService.getInstance();
        
        // Create a prompt for the next scene with continuity
        const continuityPrompt = `Based on the previous scene, create the next scene in this video sequence:

PREVIOUS SCENE: "${lastPrompt.prompt}"

NEXT SCENE INSTRUCTION: "${instruction}"

Create a new Veo 3 prompt for the next scene that:
1. Maintains visual and narrative continuity from the previous scene
2. Follows the user's instruction for what happens next
3. Uses the SSASA framework (Subject, Scene, Action, Style, Audio)
4. Ensures smooth transitions using "this then that" technique
5. Keeps consistent character details, lighting, and style where appropriate

Generate ONLY the new prompt text, optimized for Veo 3.`;

        const nextScenePrompt = await gptService.modifyPrompt({
          prompt: continuityPrompt,
          instruction: "Generate the next scene prompt"
        });

        // Create the next scene prompt
        const nextScene = {
          id: `sequence-scene-${Date.now()}`,
          title: `${lastPrompt.title} - Scene ${sequenceBuilder.length + 1}`,
          prompt: nextScenePrompt,
          category: 'sequence',
          sequenceId: `seq-${Date.now()}`,
          sequenceOrder: sequenceBuilder.length + 1,
          dateAdded: new Date().toISOString(),
          previousScene: lastPrompt.id
        };

        // Add to sequence
        sequenceBuilder.push(nextScene);
        
        showToast(`✅ Next scene added to sequence! (${sequenceBuilder.length} scenes total)`, 'success');
        modal.remove();
        
        // Refresh the sequences view
        updateSequenceIndicator();
        showSequences();

      } catch (error) {
        console.error('Generate next scene error:', error);
        showToast(error.message, 'error');
      } finally {
        generateBtn.disabled = false;
        generateBtn.classList.remove('loading');
        generateBtn.textContent = originalText;
      }
    });

    // Close on escape key
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.remove();
      }
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  function showModifySequenceModal(sequenceItem) {
    const modal = document.createElement('div');
    modal.className = 'modify-modal';
    modal.innerHTML = `
      <div class="modify-content">
        <div class="settings-header">
          <h2>Modify Scene</h2>
          <button class="close-button" id="close-modify-sequence">✕</button>
        </div>
        
        <div style="margin-bottom: 16px; padding: 12px; background: #333333; border-radius: 6px;">
          <h4 style="margin-bottom: 8px; color: #ffffff;">Current Scene:</h4>
          <div style="font-size: 13px; color: #b0b0b0; max-height: 120px; overflow-y: auto;">
            <strong>${sequenceItem.title}</strong><br>
            ${sequenceItem.prompt}
          </div>
        </div>
        
        <div>
          <label>How would you like to modify this scene?</label>
          <textarea id="modify-sequence-instruction" class="modify-instruction" placeholder="e.g., Make it more dramatic, change the lighting to nighttime, add more dialogue..."></textarea>
          <p style="font-size: 12px; color: #b0b0b0; margin-bottom: 16px;">
            Describe the changes you want. The AI will modify this scene while maintaining continuity with other scenes in your sequence.
          </p>
        </div>
        
        <div class="settings-actions">
          <button type="button" class="secondary" id="cancel-modify-sequence">Cancel</button>
          <button type="button" class="primary" id="apply-sequence-modification">✨ Apply Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    // Focus on textarea
    const textarea = modal.querySelector('#modify-sequence-instruction');
    textarea.focus();

    // Close button
    modal.querySelector('#close-modify-sequence').addEventListener('click', () => {
      modal.remove();
    });

    // Cancel button
    modal.querySelector('#cancel-modify-sequence').addEventListener('click', () => {
      modal.remove();
    });

    // Apply modification
    modal.querySelector('#apply-sequence-modification').addEventListener('click', async () => {
      const instruction = textarea.value.trim();
      if (!instruction) {
        showToast('Please describe the changes you want', 'error');
        return;
      }

      const applyBtn = modal.querySelector('#apply-sequence-modification');
      applyBtn.disabled = true;
      applyBtn.classList.add('loading');
      const originalText = applyBtn.textContent;
      applyBtn.textContent = '';

      try {
        const gptService = GPTService.getInstance();
        
        const modifiedPrompt = await gptService.modifyPrompt({
          prompt: sequenceItem.prompt,
          instruction: instruction
        });

        // Update the sequence item
        const itemIndex = sequenceBuilder.findIndex(item => item.sequenceId === sequenceItem.sequenceId);
        if (itemIndex !== -1) {
          sequenceBuilder[itemIndex] = {
            ...sequenceBuilder[itemIndex],
            prompt: modifiedPrompt,
            title: `${sequenceItem.title} (Modified)`,
            lastModified: new Date().toISOString()
          };
        }

        showToast('✅ Scene modified successfully!', 'success');
        modal.remove();
        
        // Refresh the sequences view
        showSequences();

      } catch (error) {
        console.error('Modify sequence error:', error);
        showToast(error.message, 'error');
      } finally {
        applyBtn.disabled = false;
        applyBtn.classList.remove('loading');
        applyBtn.textContent = originalText;
      }
    });

    // Close on escape key
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.remove();
      }
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Initialize tier display
  function updateTierDisplay() {
    const tierService = window.tierService;
    if (!tierService) return;
    
    // Tier display removed - will add paid tiers in next version
  }
  
  function getTierColor(tier) {
    const colors = {
      free: '#6c757d',
      byok: '#17a2b8', 
      paid: '#667eea'
    };
    return colors[tier] || '#6c757d';
  }
  
  // Update all UI elements based on tier permissions
  function updateTierRestrictedElements() {
    const tierService = window.tierService;
    if (!tierService) return;
    
    const canModify = tierService.canModifyPrompts();
    const canSave = tierService.canPerformAction('canSavePrompts');
    
    // Update all modify buttons
    document.querySelectorAll('[data-action="modify"]').forEach(btn => {
      if (canModify) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.title = 'Modify this prompt with AI';
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.title = 'Upgrade to BYOK or Premium to modify prompts';
      }
    });
    
    // Update all save buttons
    document.querySelectorAll('[data-action="save"]').forEach(btn => {
      if (canSave) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.title = 'Save to your personal library';
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.title = 'Upgrade to BYOK or Premium to save prompts';
      }
    });
    
    // Update sequence buttons (also requires BYOK/Premium)
    document.querySelectorAll('[data-action="add-sequence"]').forEach(btn => {
      if (canSave) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.title = 'Add to sequence';
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.title = 'Upgrade to BYOK or Premium to use sequences';
      }
    });
  }

  // Initialize event listeners
  document.getElementById('settings-btn').addEventListener('click', showSettings);
  
  // Search is always visible now, handle input changes
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    document.getElementById('clear-search').style.display = searchQuery ? 'block' : 'none';
    handleSearch();
  });

  // Add custom prompt button handler
  const customPromptBtn = document.getElementById('custom-prompt-btn');
  if (customPromptBtn) {
    customPromptBtn.addEventListener('click', () => {
      // Show custom prompt interface
      showCustomPromptInterface();
    });
  }
  
  document.getElementById('sequences-btn').addEventListener('click', showSequences);
  
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
  
  // Listen for tier changes
  document.addEventListener('tierChanged', () => {
    updateTierDisplay();
    updateTierRestrictedElements();
  });

  // Load data and initialize
  await Promise.all([
    loadPrompts(),
    loadSavedPrompts(),
    loadSavedSequences(),
    checkApiKey()
  ]);
  
  // Check and fix tier mismatch (user has API key but stuck in free tier)
  const tierService = window.tierService;
  if (tierService) {
    setTimeout(async () => {
      const currentTier = tierService.getCurrentTier();
      const hasStoredApiKey = await gptService.getApiKey();
      
      // If user has API key but is in free tier, auto-upgrade to BYOK
      if (currentTier === 'free' && hasStoredApiKey) {
        try {
          console.log('🔧 Fixing tier mismatch: User has API key but is in free tier');
          await tierService.upgradeToBYOK(hasStoredApiKey);
          console.log('✅ User automatically upgraded to BYOK tier');
          showToast('🔧 Fixed account status - you now have BYOK access!', 'success');
          updateTierDisplay();
          updateTierRestrictedElements();
        } catch (error) {
          console.error('Failed to fix tier mismatch:', error);
        }
      }
    }, 200); // Delay to ensure tier service is fully loaded
  }
  
  // Initialize tier display and restrictions
  setTimeout(() => {
    updateTierDisplay();
    updateTierRestrictedElements();
  }, 100); // Small delay to ensure tier service is loaded
  
  showCategories();
});
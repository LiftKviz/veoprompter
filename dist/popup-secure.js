// Full React-powered popup with GPT-4o modification - SECURE VERSION
document.addEventListener('DOMContentLoaded', async () => {
  // GPT Service for prompt modification
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

  // Create the main app structure using secure DOM methods
  function createAppStructure() {
    const app = DOMUtils.createDiv('app');
    
    // Create header
    const header = DOMUtils.createDiv('header');
    const headerContent = DOMUtils.createDiv('header-content');
    
    const headerTitle = DOMUtils.createElement('h1', 'header-title', 'Veo 3 Prompt Assistant');
    
    const tierDisplay = DOMUtils.createDiv('tier-status');
    tierDisplay.id = 'tier-display';
    tierDisplay.style.cssText = `
      font-size: 11px;
      background: #6c757d;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
    `;
    tierDisplay.title = 'Click to manage your plan';
    tierDisplay.textContent = 'Free';
    
    const headerActions = DOMUtils.createDiv('header-actions');
    
    // Search container
    const searchContainer = DOMUtils.createDiv('search-container');
    searchContainer.style.display = 'none';
    const searchInput = DOMUtils.createInput('text', 'search-input', 'search-input', 'Search prompts...');
    const clearSearchBtn = DOMUtils.createButton('icon-button', '✕', null);
    clearSearchBtn.id = 'clear-search';
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(clearSearchBtn);
    
    // Action buttons
    const searchBtn = DOMUtils.createButton('icon-button', '🔍', null);
    searchBtn.id = 'search-btn';
    
    const sequencesBtn = DOMUtils.createButton('icon-button', '🎬', null);
    sequencesBtn.id = 'sequences-btn';
    sequencesBtn.title = 'Sequences';
    
    const apiStatus = DOMUtils.createDiv('api-status');
    const statusIndicator = DOMUtils.createElement('span', 'status-indicator', '⚪');
    statusIndicator.id = 'status-indicator';
    apiStatus.appendChild(statusIndicator);
    
    const settingsBtn = DOMUtils.createButton('icon-button', '⚙️', null);
    settingsBtn.id = 'settings-btn';
    
    // Assemble header actions
    headerActions.appendChild(searchContainer);
    headerActions.appendChild(searchBtn);
    headerActions.appendChild(sequencesBtn);
    headerActions.appendChild(apiStatus);
    headerActions.appendChild(settingsBtn);
    
    // Assemble header
    headerContent.appendChild(headerTitle);
    headerContent.appendChild(tierDisplay);
    headerContent.appendChild(headerActions);
    header.appendChild(headerContent);
    
    // Create main content
    const appContent = DOMUtils.createDiv('app-content');
    
    // Onboarding banner
    const onboardingBanner = DOMUtils.createDiv('onboarding-banner');
    onboardingBanner.id = 'onboarding-banner';
    onboardingBanner.style.display = 'none';
    
    const bannerTitle = DOMUtils.createElement('h3', null, '🚀 Get Started!');
    const bannerText = DOMUtils.createElement('p', null, 'Add your OpenAI API key to unlock prompt modification features.');
    const setupButton = DOMUtils.createButton('primary', 'Setup API Key', null);
    setupButton.id = 'setup-api-key';
    
    onboardingBanner.appendChild(bannerTitle);
    onboardingBanner.appendChild(bannerText);
    onboardingBanner.appendChild(setupButton);
    
    // Main view
    const mainView = DOMUtils.createDiv(null);
    mainView.id = 'main-view';
    
    appContent.appendChild(onboardingBanner);
    appContent.appendChild(mainView);
    
    // Assemble app
    app.appendChild(header);
    app.appendChild(appContent);
    
    return app;
  }

  // Create and inject styles
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        width: 400px; 
        height: 700px; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: #e0e0e0;
        background: #1a1a1a;
        border-radius: 12px;
        overflow: hidden;
      }
      .app { height: 100%; display: flex; flex-direction: column; }
      .header {
        background: #2d2d2d;
        border-bottom: 1px solid #404040;
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
        color: #ffffff;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
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
        overflow: hidden;
        padding: 12px;
        display: flex;
        flex-direction: column;
      }
      #main-view {
        flex: 1;
        overflow: hidden;
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
        transform: translateY(-1px);
      }
      .prompt-card.expanded {
        background: #333333;
        border-color: #3b82f6;
      }
      .prompt-title {
        font-weight: 500;
        margin-bottom: 4px;
        color: #ffffff;
      }
      .prompt-content {
        font-size: 13px;
        color: #c0c0c0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.4;
      }
      .prompt-content.expanded {
        -webkit-line-clamp: unset;
        margin-bottom: 12px;
      }
      .prompt-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .action-button {
        padding: 6px 12px;
        border: 1px solid #404040;
        background: #2a2a2a;
        color: #e0e0e0;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      .action-button:hover {
        background: #333333;
        border-color: #3b82f6;
      }
      .action-button.primary {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
      }
      .action-button.primary:hover {
        background: #2563eb;
      }
      .modify-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modify-content {
        background: #2a2a2a;
        padding: 24px;
        border-radius: 8px;
        width: 90%;
        max-width: 350px;
      }
      .modify-content h3 {
        margin-bottom: 16px;
        color: #ffffff;
      }
      .modify-content textarea {
        width: 100%;
        min-height: 80px;
        padding: 8px;
        border: 1px solid #404040;
        border-radius: 4px;
        background: #1a1a1a;
        color: #e0e0e0;
        font-size: 14px;
        resize: vertical;
      }
      .modify-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
        justify-content: flex-end;
      }
      .settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .settings-modal {
        background: #2a2a2a;
        padding: 24px;
        border-radius: 8px;
        width: 90%;
        max-width: 350px;
      }
      .settings-modal h2 {
        margin-bottom: 20px;
        color: #ffffff;
      }
      .settings-modal label {
        display: block;
        margin-bottom: 8px;
        color: #e0e0e0;
        font-size: 14px;
      }
      .api-key-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #404040;
        border-radius: 4px;
        background: #1a1a1a;
        color: #e0e0e0;
        font-size: 14px;
      }
      .settings-actions {
        display: flex;
        gap: 8px;
        margin-top: 20px;
        justify-content: flex-end;
      }
      .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 20px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 2000;
        animation: slideUp 0.3s ease;
      }
      .toast.success {
        background: #16a34a;
        color: white;
      }
      .toast.error {
        background: #dc2626;
        color: white;
      }
      .toast.info {
        background: #3b82f6;
        color: white;
      }
      @keyframes slideUp {
        from { transform: translate(-50%, 100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      .onboarding-banner {
        background: #2a2a2a;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        text-align: center;
      }
      .onboarding-banner h3 {
        margin-bottom: 8px;
        color: #ffffff;
      }
      .onboarding-banner p {
        margin-bottom: 12px;
        color: #e0e0e0;
        font-size: 14px;
      }
      .onboarding-banner button {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .onboarding-banner button:hover {
        background: #2563eb;
      }
      .sequences-count {
        background: #dc2626;
        color: white;
        border-radius: 50%;
        padding: 0 4px;
        font-size: 10px;
        position: absolute;
        top: 0;
        right: 0;
      }
      .prompt-list-container {
        flex: 1;
        overflow-y: auto;
        margin-right: -8px;
        padding-right: 8px;
      }
      .prompt-list-container::-webkit-scrollbar {
        width: 6px;
      }
      .prompt-list-container::-webkit-scrollbar-track {
        background: #1a1a1a;
      }
      .prompt-list-container::-webkit-scrollbar-thumb {
        background: #404040;
        border-radius: 3px;
      }
      .prompt-list-container::-webkit-scrollbar-thumb:hover {
        background: #555555;
      }
      .youtube-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #3b82f6;
        text-decoration: none;
        font-size: 12px;
        margin-top: 4px;
      }
      .youtube-link:hover {
        text-decoration: underline;
      }
      .sequence-item {
        background: #1a1a1a;
        border: 1px solid #404040;
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 8px;
        font-size: 13px;
        color: #e0e0e0;
      }
      .sequence-item strong {
        color: #3b82f6;
      }
      .sequence-length {
        font-size: 12px;
        color: #b0b0b0;
        margin-top: 8px;
      }
      .search-highlight {
        background: #fbbf24;
        color: #1a1a1a;
        padding: 0 2px;
        border-radius: 2px;
      }
      .loading {
        opacity: 0.7;
        pointer-events: none;
      }
      .loading::after {
        content: '...';
        animation: dots 1.5s steps(4, end) infinite;
      }
      @keyframes dots {
        0%, 20% { content: ''; }
        40% { content: '.'; }
        60% { content: '..'; }
        80%, 100% { content: '...'; }
      }
      /* Custom dropdown styles */
      select {
        width: 100%;
        padding: 8px;
        border: 1px solid #404040;
        border-radius: 4px;
        background: #1a1a1a;
        color: #e0e0e0;
        font-size: 14px;
        cursor: pointer;
      }
      select option {
        background: #1a1a1a;
        color: #e0e0e0;
      }
      /* Pre-formatted text for Veo 2 code */
      pre {
        background: #1a1a1a;
        border: 1px solid #404040;
        border-radius: 4px;
        padding: 12px;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
        color: #e0e0e0;
      }
      code {
        background: #1a1a1a;
        padding: 2px 4px;
        border-radius: 2px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #3b82f6;
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize the app
  injectStyles();
  
  // Clear body and add secure content
  DOMUtils.clearElement(document.body);
  const appStructure = createAppStructure();
  document.body.appendChild(appStructure);

  // The rest of the code will be converted similarly...
  // This is a demonstration of the secure approach
  
  // I'll continue with the full conversion in the next part
});
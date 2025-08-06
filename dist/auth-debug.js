// Debug Auth Module - Maximum visibility for troubleshooting

class DebugAuth {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    
    // Add visible logging
    this.log('🚀 DebugAuth: Constructor called');
    this.addDebugPanel();
    this.init();
  }

  log(message, data = null) {
    console.log(message, data);
    this.updateDebugPanel(message);
  }

  addDebugPanel() {
    // Add a debug panel to the page
    const debugPanel = document.createElement('div');
    debugPanel.id = 'auth-debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 300px;
      max-height: 200px;
      background: rgba(0,0,0,0.8);
      color: white;
      font-family: monospace;
      font-size: 11px;
      padding: 10px;
      z-index: 10000;
      overflow-y: auto;
      border-radius: 0 0 0 8px;
    `;
    debugPanel.innerHTML = '<div><strong>Auth Debug Log:</strong></div><div id="debug-messages"></div>';
    
    // Wait for body to be available
    const addPanel = () => {
      if (document.body) {
        document.body.appendChild(debugPanel);
        this.log('📋 Debug panel added');
      } else {
        setTimeout(addPanel, 50);
      }
    };
    addPanel();
  }

  updateDebugPanel(message) {
    const messagesDiv = document.getElementById('debug-messages');
    if (messagesDiv) {
      const messageEl = document.createElement('div');
      messageEl.textContent = new Date().toLocaleTimeString() + ' - ' + message;
      messageEl.style.borderBottom = '1px solid #333';
      messageEl.style.padding = '2px 0';
      messagesDiv.appendChild(messageEl);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }

  init() {
    this.log('🔄 DebugAuth: Init started');
    
    chrome.storage.local.get(['debugUser'], (result) => {
      if (chrome.runtime.lastError) {
        this.log('❌ Storage error: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (result.debugUser) {
        this.log('👤 Found existing user: ' + result.debugUser.email);
        this.currentUser = result.debugUser;
        this.notifyListeners(this.currentUser);
      } else {
        this.log('👤 No existing user found');
      }
      
      this.injectUI();
    });
  }

  async signIn() {
    this.log('🔐 Sign in button clicked!');
    
    try {
      const testUser = {
        id: 'debug-' + Date.now(),
        email: 'debug@test.com',
        name: 'Debug User',
        picture: '',  // No picture to avoid broken image
        signedInAt: new Date().toISOString()
      };

      this.log('👤 Creating test user', testUser);

      // Save to storage
      chrome.storage.local.set({ debugUser: testUser }, () => {
        if (chrome.runtime.lastError) {
          this.log('❌ Save error: ' + chrome.runtime.lastError.message);
          return;
        }
        
        this.log('✅ User saved to storage');
        this.currentUser = testUser;
        this.notifyListeners(testUser);
      });

      this.log('✅ Sign in completed');
      return testUser;

    } catch (error) {
      this.log('❌ Sign in failed: ' + error.message);
      throw error;
    }
  }

  async signOut() {
    this.log('🚪 Sign out clicked');
    
    chrome.storage.local.remove('debugUser', () => {
      if (chrome.runtime.lastError) {
        this.log('❌ Remove error: ' + chrome.runtime.lastError.message);
        return;
      }
      
      this.log('✅ User removed from storage');
      this.currentUser = null;
      this.notifyListeners(null);
    });
  }

  onAuthStateChange(callback) {
    this.log('📡 Auth listener added');
    this.authListeners.push(callback);
    callback(this.currentUser);
    
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(user) {
    this.log('📢 Notifying ' + this.authListeners.length + ' listeners. User: ' + (user ? 'signed in' : 'signed out'));
    this.authListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        this.log('❌ Listener error: ' + error.message);
      }
    });
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isSignedIn() {
    return !!this.currentUser;
  }

  injectUI() {
    this.log('🎨 Starting UI injection...');
    
    const tryInject = () => {
      const headerActions = document.querySelector('.header-actions');
      if (!headerActions) {
        this.log('⏳ Header not ready, retrying...');
        setTimeout(tryInject, 200);
        return;
      }

      this.log('✅ Header found! Creating auth UI');

      // Remove existing
      const existing = document.querySelector('.debug-auth-container');
      if (existing) {
        existing.remove();
      }

      // Create container
      const authContainer = document.createElement('div');
      authContainer.className = 'debug-auth-container';
      authContainer.style.cssText = `
        display: flex; 
        align-items: center; 
        gap: 8px; 
        margin-right: 8px;
        background: #f0f8ff;
        border: 2px solid #4285f4;
        border-radius: 4px;
        padding: 4px;
      `;

      const updateUI = (user) => {
        this.log('🎨 Updating UI. User: ' + (user ? user.email : 'none'));
        authContainer.innerHTML = '';

        if (user) {
          // Signed in state - no image, just text
          const userDiv = document.createElement('div');
          userDiv.style.cssText = 'display: flex; align-items: center; gap: 6px; padding: 2px 6px;';
          
          // Text avatar (no image)
          const avatar = document.createElement('div');
          avatar.textContent = '👤';
          avatar.style.cssText = `
            width: 20px; 
            height: 20px; 
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          `;
          
          // Name
          const nameSpan = document.createElement('span');
          nameSpan.textContent = user.name;
          nameSpan.style.cssText = 'font-size: 12px; color: #333; font-weight: bold;';
          
          // Sign out button
          const signOutBtn = document.createElement('button');
          signOutBtn.innerHTML = '❌';
          signOutBtn.title = 'Sign Out';
          signOutBtn.style.cssText = `
            background: #ff4444;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 12px;
            padding: 2px 6px;
            border-radius: 3px;
          `;
          signOutBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.log('🚪 Sign out button clicked');
            this.signOut();
          };
          
          userDiv.appendChild(avatar);
          userDiv.appendChild(nameSpan);
          userDiv.appendChild(signOutBtn);
          authContainer.appendChild(userDiv);
          
        } else {
          // Signed out state
          const signInBtn = document.createElement('button');
          signInBtn.innerHTML = '🔐 DEBUG SIGN IN';
          signInBtn.style.cssText = `
            background: #4285f4;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
          `;
          signInBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.log('🔐 Sign in button clicked - starting process');
            this.signIn().catch(error => {
              this.log('❌ Sign in error: ' + error.message);
              alert('Sign in failed: ' + error.message);
            });
          };
          
          authContainer.appendChild(signInBtn);
        }
      };

      // Insert into header
      const settingsBtn = document.getElementById('settings-btn');
      if (settingsBtn && settingsBtn.parentElement) {
        settingsBtn.parentElement.insertBefore(authContainer, settingsBtn);
        this.log('✅ Auth UI inserted before settings');
      } else {
        headerActions.appendChild(authContainer);
        this.log('✅ Auth UI appended to header');
      }

      // Listen for changes
      this.onAuthStateChange(updateUI);
      this.log('✅ UI injection complete');
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryInject);
    } else {
      tryInject();
    }
  }
}

// Create instance
console.log('Creating DebugAuth instance...');
window.authModule = new DebugAuth();
window.debugAuth = window.authModule; // For manual testing
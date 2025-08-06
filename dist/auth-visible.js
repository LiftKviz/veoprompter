// Super Visible Auth Module - Maximum feedback

class VisibleAuth {
  constructor() {
    // Show immediate feedback
    console.log('🚀 VisibleAuth: Starting...');
    alert('🚀 VisibleAuth: Constructor called! Check console.');
    
    this.currentUser = null;
    this.authListeners = [];
    this.debugMessages = [];
    
    this.log('📱 VisibleAuth initialized');
    this.init();
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    const fullMessage = `${timestamp} - ${message}`;
    
    console.log(fullMessage);
    this.debugMessages.push(fullMessage);
    
    // Keep only last 10 messages
    if (this.debugMessages.length > 10) {
      this.debugMessages.shift();
    }
    
    this.updateDebugDisplay();
  }

  updateDebugDisplay() {
    // Try to update debug display
    const debugEl = document.getElementById('visible-debug');
    if (debugEl) {
      debugEl.innerHTML = this.debugMessages.map(msg => 
        `<div style="border-bottom: 1px solid #ccc; padding: 2px;">${msg}</div>`
      ).join('');
    }
  }

  createDebugPanel() {
    this.log('🎨 Creating debug panel...');
    
    // Remove existing
    const existing = document.getElementById('visible-debug');
    if (existing) existing.remove();
    
    // Create new panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'visible-debug';
    debugPanel.style.cssText = `
      position: fixed !important;
      top: 10px !important;
      right: 10px !important;
      width: 280px !important;
      max-height: 150px !important;
      background: #000 !important;
      color: #0f0 !important;
      font-family: monospace !important;
      font-size: 10px !important;
      padding: 8px !important;
      z-index: 999999 !important;
      overflow-y: auto !important;
      border: 2px solid #0f0 !important;
      border-radius: 4px !important;
    `;
    
    // Add to body or extension root
    const target = document.body || document.documentElement;
    if (target) {
      target.appendChild(debugPanel);
      this.log('✅ Debug panel added to ' + target.tagName);
      this.updateDebugDisplay();
    } else {
      this.log('❌ No target element for debug panel');
    }
  }

  init() {
    this.log('🔄 Init started');
    
    // Create debug panel immediately
    this.createDebugPanel();
    
    // Check storage
    chrome.storage.local.get(['visibleUser'], (result) => {
      if (chrome.runtime.lastError) {
        this.log('❌ Storage error: ' + chrome.runtime.lastError.message);
        alert('❌ Storage error: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (result.visibleUser) {
        this.log('👤 Found existing user');
        this.currentUser = result.visibleUser;
        this.notifyListeners(this.currentUser);
      } else {
        this.log('👤 No existing user');
      }
      
      // Start UI injection
      this.injectUI();
    });
  }

  async signIn() {
    this.log('🔐 SIGN IN CLICKED!');
    alert('🔐 Sign in process starting!');
    
    try {
      const testUser = {
        id: 'visible-' + Date.now(),
        email: 'visible@test.com',
        name: 'Visible User',
        signedInAt: new Date().toISOString()
      };

      this.log('👤 Creating user: ' + testUser.email);

      // Save to storage
      chrome.storage.local.set({ visibleUser: testUser }, () => {
        if (chrome.runtime.lastError) {
          this.log('❌ Save failed: ' + chrome.runtime.lastError.message);
          alert('❌ Save failed: ' + chrome.runtime.lastError.message);
          return;
        }
        
        this.log('✅ User saved successfully!');
        alert('✅ User created and saved!');
        this.currentUser = testUser;
        this.notifyListeners(testUser);
      });

      return testUser;

    } catch (error) {
      this.log('❌ Sign in error: ' + error.message);
      alert('❌ Sign in error: ' + error.message);
      throw error;
    }
  }

  async signOut() {
    this.log('🚪 SIGN OUT CLICKED!');
    alert('🚪 Signing out...');
    
    chrome.storage.local.remove('visibleUser', () => {
      if (chrome.runtime.lastError) {
        this.log('❌ Remove failed: ' + chrome.runtime.lastError.message);
        return;
      }
      
      this.log('✅ User signed out successfully!');
      alert('✅ Signed out successfully!');
      this.currentUser = null;
      this.notifyListeners(null);
    });
  }

  onAuthStateChange(callback) {
    this.log('📡 Adding auth listener');
    this.authListeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(user) {
    this.log('📢 Notifying listeners. User: ' + (user ? 'SIGNED IN' : 'SIGNED OUT'));
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
    
    let attempts = 0;
    const maxAttempts = 20;
    
    const tryInject = () => {
      attempts++;
      this.log(`🔍 UI injection attempt ${attempts}/${maxAttempts}`);
      
      const headerActions = document.querySelector('.header-actions');
      if (!headerActions) {
        if (attempts < maxAttempts) {
          this.log('⏳ Header not found, retrying...');
          setTimeout(tryInject, 300);
        } else {
          this.log('❌ Header never found after ' + maxAttempts + ' attempts');
          alert('❌ Could not find header element');
        }
        return;
      }

      this.log('✅ Header element found!');

      // Remove existing auth UI
      const existing = document.querySelector('.visible-auth-container');
      if (existing) {
        existing.remove();
        this.log('🗑️ Removed existing auth UI');
      }

      // Create highly visible auth container
      const authContainer = document.createElement('div');
      authContainer.className = 'visible-auth-container';
      authContainer.style.cssText = `
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        margin-right: 8px !important;
        background: #ff0 !important;
        border: 3px solid #f00 !important;
        border-radius: 6px !important;
        padding: 6px !important;
      `;

      const updateUI = (user) => {
        this.log('🎨 Updating UI for: ' + (user ? user.email : 'NO USER'));
        authContainer.innerHTML = '';

        if (user) {
          // Signed in state
          const signedInDiv = document.createElement('div');
          signedInDiv.style.cssText = 'display: flex; align-items: center; gap: 6px;';
          
          // Status text
          const statusText = document.createElement('span');
          statusText.textContent = '✅ SIGNED IN';
          statusText.style.cssText = 'font-weight: bold; color: #008000; font-size: 12px;';
          
          // User name
          const nameText = document.createElement('span');
          nameText.textContent = user.name;
          nameText.style.cssText = 'font-size: 11px; color: #000;';
          
          // Sign out button
          const signOutBtn = document.createElement('button');
          signOutBtn.innerHTML = '🚪 SIGN OUT';
          signOutBtn.style.cssText = `
            background: #f00 !important;
            color: #fff !important;
            border: none !important;
            padding: 4px 8px !important;
            border-radius: 3px !important;
            cursor: pointer !important;
            font-size: 10px !important;
            font-weight: bold !important;
          `;
          signOutBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.log('🚪 Sign out button clicked');
            this.signOut();
          };
          
          signedInDiv.appendChild(statusText);
          signedInDiv.appendChild(nameText);
          signedInDiv.appendChild(signOutBtn);
          authContainer.appendChild(signedInDiv);
          
        } else {
          // Signed out state
          const signInBtn = document.createElement('button');
          signInBtn.innerHTML = '🔐 CLICK TO SIGN IN';
          signInBtn.style.cssText = `
            background: #008000 !important;
            color: #fff !important;
            border: none !important;
            padding: 8px 12px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            font-weight: bold !important;
            animation: blink 1s infinite;
          `;
          
          // Add blinking animation
          const style = document.createElement('style');
          style.textContent = `
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0.5; }
            }
          `;
          document.head.appendChild(style);
          
          signInBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.log('🔐 SIGN IN BUTTON CLICKED!!!');
            this.signIn().catch(error => {
              this.log('❌ Sign in failed: ' + error.message);
              alert('❌ Sign in failed: ' + error.message);
            });
          };
          
          authContainer.appendChild(signInBtn);
        }
      };

      // Insert auth UI
      headerActions.insertBefore(authContainer, headerActions.firstChild);
      this.log('✅ Auth UI inserted into header!');
      
      // Set up auth state listener
      this.onAuthStateChange(updateUI);
      this.log('✅ UI injection completed successfully!');
    };

    // Start injection
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryInject);
      this.log('📅 Waiting for DOM ready...');
    } else {
      tryInject();
    }
  }
}

// Create instance immediately
console.log('Creating VisibleAuth...');
window.authModule = new VisibleAuth();
window.visibleAuth = window.authModule;
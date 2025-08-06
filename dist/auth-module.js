// Google Sign-In Authentication Module for Chrome Extension
// This module handles Google authentication for the Veo 3 Prompt Assistant

class AuthModule {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.initializeAuth();
  }

  initializeAuth() {
    // Check for existing auth state
    chrome.storage.local.get(['userAuth'], (result) => {
      if (result.userAuth) {
        this.currentUser = result.userAuth;
        this.notifyListeners(this.currentUser);
      }
    });
  }

  // Sign in with Google using Chrome Identity API
  async signIn() {
    console.log('Sign in attempt started');
    
    if (!chrome.identity) {
      console.error('Chrome Identity API not available');
      alert('Chrome Identity API not available. Check extension permissions.');
      return;
    }
    
    return new Promise((resolve, reject) => {
      // Requesting auth token
      // Use chrome.identity.getAuthToken for Chrome Extension OAuth
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          console.error('Auth error details:', {
            message: chrome.runtime.lastError.message,
            error: chrome.runtime.lastError
          });
          alert('OAuth Error: ' + chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError);
          return;
        }

        try {
          // Get user info from Google OAuth2 API
          const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to get user info');
          }

          const userInfo = await response.json();
          
          // Store user data
          const userData = {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            token: token,
            signedInAt: new Date().toISOString()
          };

          // Save to Chrome storage
          chrome.storage.local.set({ userAuth: userData }, () => {
            this.currentUser = userData;
            this.notifyListeners(userData);
            resolve(userData);
          });

        } catch (error) {
          console.error('Failed to get user info:', error);
          reject(error);
        }
      });
    });
  }

  // Sign out
  async signOut() {
    return new Promise((resolve) => {
      // Clear the cached auth token
      if (this.currentUser && this.currentUser.token) {
        chrome.identity.removeCachedAuthToken({ token: this.currentUser.token }, () => {
          // Auth token cleared
        });
      }

      // Clear from storage
      chrome.storage.local.remove('userAuth', () => {
        this.currentUser = null;
        this.notifyListeners(null);
        resolve();
      });
    });
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Add auth state listener
  onAuthStateChange(callback) {
    this.authListeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.authListeners = this.authListeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  notifyListeners(user) {
    this.authListeners.forEach(listener => listener(user));
  }

  // Check if user is signed in
  isSignedIn() {
    return !!this.currentUser;
  }

  // Inject auth UI into the header
  injectAuthUI() {
    // Wait for DOM to be ready
    setTimeout(() => {
      const headerActions = document.querySelector('.header-actions');
      if (!headerActions) return;

      // Create auth container
      const authContainer = document.createElement('div');
      authContainer.className = 'auth-container';
      authContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-right: 8px;';

      // Create auth button/info
      const updateAuthUI = (user) => {
        authContainer.innerHTML = '';
        
        if (user) {
          // Signed in state
          const userInfo = document.createElement('div');
          userInfo.style.cssText = 'display: flex; align-items: center; gap: 8px;';
          
          if (user.picture) {
            const avatar = document.createElement('img');
            avatar.src = user.picture;
            avatar.style.cssText = 'width: 24px; height: 24px; border-radius: 50%;';
            avatar.title = user.email;
            userInfo.appendChild(avatar);
          }
          
          const signOutBtn = document.createElement('button');
          signOutBtn.className = 'icon-button';
          signOutBtn.innerHTML = '↩️';
          signOutBtn.title = 'Sign Out';
          signOutBtn.onclick = () => this.signOut();
          
          authContainer.appendChild(userInfo);
          authContainer.appendChild(signOutBtn);
        } else {
          // Signed out state
          const signInBtn = document.createElement('button');
          signInBtn.className = 'primary-button';
          signInBtn.style.cssText = 'padding: 4px 12px; font-size: 13px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;';
          signInBtn.innerHTML = '🔑 Sign In';
          signInBtn.onclick = () => {
            console.log('Sign in button clicked');
            this.signIn().catch(error => {
              console.error('Sign in failed:', error);
              alert('Sign in failed: ' + error.message);
            });
          };
          
          authContainer.appendChild(signInBtn);
        }
      };

      // Insert before settings button
      const settingsBtn = document.getElementById('settings-btn');
      if (settingsBtn && settingsBtn.parentElement) {
        settingsBtn.parentElement.insertBefore(authContainer, settingsBtn);
      }

      // Listen for auth changes
      this.onAuthStateChange(updateAuthUI);
    }, 100);
  }

  // Save user prompts to their account
  async saveUserPrompt(prompt) {
    if (!this.currentUser) return;
    
    const userPrompts = await this.getUserPrompts();
    userPrompts.push({
      ...prompt,
      savedAt: new Date().toISOString(),
      userId: this.currentUser.id
    });
    
    chrome.storage.local.set({ 
      [`userPrompts_${this.currentUser.id}`]: userPrompts 
    });
  }

  // Get user's saved prompts
  async getUserPrompts() {
    if (!this.currentUser) return [];
    
    return new Promise((resolve) => {
      chrome.storage.local.get([`userPrompts_${this.currentUser.id}`], (result) => {
        resolve(result[`userPrompts_${this.currentUser.id}`] || []);
      });
    });
  }
}

// Create global instance
window.authModule = new AuthModule();

// Auto-inject UI when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.authModule.injectAuthUI();
  });
} else {
  window.authModule.injectAuthUI();
}
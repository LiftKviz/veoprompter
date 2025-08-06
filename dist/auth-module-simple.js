// Simplified Auth Module for Testing (No OAuth Required)
// This version creates a mock user for testing the UI flow

class SimpleAuthModule {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.initializeAuth();
  }

  initializeAuth() {
    console.log('SimpleAuthModule: Initializing...');
    // Check for existing auth state
    chrome.storage.local.get(['userAuth'], (result) => {
      if (result.userAuth) {
        console.log('SimpleAuthModule: Found existing user:', result.userAuth);
        this.currentUser = result.userAuth;
        this.notifyListeners(this.currentUser);
      } else {
        console.log('SimpleAuthModule: No existing user found');
      }
    });
  }

  // Mock sign in for testing
  async signIn() {
    console.log('SimpleAuthModule: Sign in attempt started');
    
    try {
      // Create a mock user for testing
      const mockUser = {
        id: 'test-user-' + Date.now(),
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://via.placeholder.com/40x40/4285f4/white?text=T',
        token: 'mock-token-' + Date.now(),
        signedInAt: new Date().toISOString()
      };

      console.log('SimpleAuthModule: Creating mock user:', mockUser);

      // Save to Chrome storage
      await new Promise((resolve) => {
        chrome.storage.local.set({ userAuth: mockUser }, () => {
          console.log('SimpleAuthModule: User saved to storage');
          this.currentUser = mockUser;
          this.notifyListeners(mockUser);
          resolve(mockUser);
        });
      });

      console.log('SimpleAuthModule: Sign in successful');
      return mockUser;
    } catch (error) {
      console.error('SimpleAuthModule: Sign in failed:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    console.log('SimpleAuthModule: Sign out started');
    return new Promise((resolve) => {
      // Clear from storage
      chrome.storage.local.remove('userAuth', () => {
        console.log('SimpleAuthModule: User cleared from storage');
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
    console.log('SimpleAuthModule: Notifying listeners:', user ? 'signed in' : 'signed out');
    this.authListeners.forEach(listener => listener(user));
  }

  // Check if user is signed in
  isSignedIn() {
    return !!this.currentUser;
  }

  // Inject auth UI into the header
  injectAuthUI() {
    console.log('SimpleAuthModule: Injecting auth UI...');
    // Wait for DOM to be ready
    setTimeout(() => {
      const headerActions = document.querySelector('.header-actions');
      if (!headerActions) {
        console.log('SimpleAuthModule: No header-actions found, retrying...');
        setTimeout(() => this.injectAuthUI(), 500);
        return;
      }

      console.log('SimpleAuthModule: Found header-actions, creating auth UI');

      // Create auth container
      const authContainer = document.createElement('div');
      authContainer.className = 'auth-container';
      authContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-right: 8px;';

      // Create auth button/info
      const updateAuthUI = (user) => {
        console.log('SimpleAuthModule: Updating auth UI for:', user ? 'signed in user' : 'signed out');
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
          signOutBtn.onclick = () => {
            console.log('SimpleAuthModule: Sign out button clicked');
            this.signOut();
          };
          
          authContainer.appendChild(userInfo);
          authContainer.appendChild(signOutBtn);
        } else {
          // Signed out state
          const signInBtn = document.createElement('button');
          signInBtn.className = 'primary-button';
          signInBtn.style.cssText = 'padding: 4px 12px; font-size: 13px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;';
          signInBtn.innerHTML = '🔑 Sign In';
          signInBtn.onclick = () => {
            console.log('SimpleAuthModule: Sign in button clicked');
            this.signIn().catch(error => {
              console.error('SimpleAuthModule: Sign in failed:', error);
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
        console.log('SimpleAuthModule: Auth UI inserted into DOM');
      } else {
        console.log('SimpleAuthModule: Settings button not found');
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
window.authModule = new SimpleAuthModule();

// Auto-inject UI when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('SimpleAuthModule: DOM loaded, injecting UI');
    window.authModule.injectAuthUI();
  });
} else {
  console.log('SimpleAuthModule: DOM already ready, injecting UI');
  window.authModule.injectAuthUI();
}
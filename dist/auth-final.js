// Final Auth Module - Clean and Professional

class AuthModule {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.init();
  }

  init() {
    // Check for existing user
    chrome.storage.local.get(['authUser'], (result) => {
      if (result.authUser) {
        this.currentUser = result.authUser;
        this.notifyListeners(this.currentUser);
      }
      this.injectUI();
    });
  }

  async signIn() {
    try {
      // Create test user (in production, this would be real Google OAuth)
      const testUser = {
        id: 'user-' + Date.now(),
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://ui-avatars.com/api/?name=Test+User&background=4285f4&color=fff&size=32',
        signedInAt: new Date().toISOString()
      };

      // Save to storage
      await new Promise((resolve) => {
        chrome.storage.local.set({ authUser: testUser }, () => {
          this.currentUser = testUser;
          this.notifyListeners(testUser);
          resolve();
        });
      });

      return testUser;
    } catch (error) {
      throw error;
    }
  }

  async signOut() {
    return new Promise((resolve) => {
      chrome.storage.local.remove('authUser', () => {
        this.currentUser = null;
        this.notifyListeners(null);
        resolve();
      });
    });
  }

  onAuthStateChange(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(user) {
    this.authListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Auth listener error:', error);
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
    const tryInject = () => {
      const headerActions = document.querySelector('.header-actions');
      if (!headerActions) {
        setTimeout(tryInject, 200);
        return;
      }

      // Remove existing auth UI
      const existing = document.querySelector('.auth-container');
      if (existing) {
        existing.remove();
      }

      // Create auth container
      const authContainer = document.createElement('div');
      authContainer.className = 'auth-container';
      authContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        margin-right: 8px;
      `;

      const updateUI = (user) => {
        authContainer.innerHTML = '';

        if (user) {
          // Signed in state
          const userInfo = document.createElement('div');
          userInfo.style.cssText = 'display: flex; align-items: center; gap: 6px;';
          
          // User avatar
          const avatar = document.createElement('img');
          avatar.src = user.picture;
          avatar.style.cssText = `
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 1px solid #ddd;
          `;
          avatar.title = user.email;
          avatar.onerror = () => {
            // Fallback to emoji if image fails
            avatar.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.textContent = '👤';
            fallback.style.cssText = 'width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 16px;';
            userInfo.insertBefore(fallback, avatar);
          };
          
          // Sign out button
          const signOutBtn = document.createElement('button');
          signOutBtn.className = 'icon-button';
          signOutBtn.innerHTML = '↩️';
          signOutBtn.title = 'Sign Out';
          signOutBtn.style.cssText = `
            background: transparent;
            border: none;
            padding: 4px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 14px;
          `;
          signOutBtn.onmouseover = () => {
            signOutBtn.style.background = '#f0f0f0';
          };
          signOutBtn.onmouseout = () => {
            signOutBtn.style.background = 'transparent';
          };
          signOutBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.signOut();
          };
          
          userInfo.appendChild(avatar);
          userInfo.appendChild(signOutBtn);
          authContainer.appendChild(userInfo);
          
        } else {
          // Signed out state
          const signInBtn = document.createElement('button');
          signInBtn.innerHTML = '🔑 Sign In';
          signInBtn.style.cssText = `
            background: #4285f4;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background-color 0.2s;
          `;
          signInBtn.onmouseover = () => {
            signInBtn.style.background = '#3367d6';
          };
          signInBtn.onmouseout = () => {
            signInBtn.style.background = '#4285f4';
          };
          signInBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.signIn().catch(error => {
              console.error('Sign in failed:', error);
            });
          };
          
          authContainer.appendChild(signInBtn);
        }
      };

      // Insert before settings button
      const settingsBtn = document.getElementById('settings-btn');
      if (settingsBtn && settingsBtn.parentElement) {
        settingsBtn.parentElement.insertBefore(authContainer, settingsBtn);
      } else {
        headerActions.appendChild(authContainer);
      }

      // Set up auth state listener
      this.onAuthStateChange(updateUI);
    };

    // Start injection
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryInject);
    } else {
      tryInject();
    }
  }

  // Save user prompts (for integration with existing popup functionality)
  async saveUserPrompt(prompt) {
    if (!this.currentUser) return false;
    
    const userPrompts = await this.getUserPrompts();
    userPrompts.push({
      ...prompt,
      savedAt: new Date().toISOString(),
      userId: this.currentUser.id
    });
    
    chrome.storage.local.set({ 
      [`userPrompts_${this.currentUser.id}`]: userPrompts 
    });
    
    return true;
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
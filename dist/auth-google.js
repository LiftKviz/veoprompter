// Real Google OAuth Authentication Module

class GoogleAuthModule {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.init();
  }

  init() {
    // Check for existing user
    chrome.storage.local.get(['googleUser'], (result) => {
      if (result.googleUser) {
        this.currentUser = result.googleUser;
        this.notifyListeners(this.currentUser);
      }
      this.injectUI();
    });
  }

  async signIn() {
    // Starting Google OAuth sign-in...
    
    if (!chrome.identity) {
      throw new Error('Chrome Identity API not available');
    }

    try {
      // Get OAuth token from Google
      const token = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (chrome.runtime.lastError) {
            // OAuth Error logged
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(token);
        });
      });

      // Got OAuth token, fetching user info...

      // Get user info from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      const userInfo = await response.json();
      console.log('Got user info:', userInfo);

      // Create user object
      const user = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        token: token,
        signedInAt: new Date().toISOString()
      };

      // Save to storage
      await new Promise((resolve) => {
        chrome.storage.local.set({ googleUser: user }, () => {
          console.log('User saved to storage');
          this.currentUser = user;
          this.notifyListeners(user);
          resolve();
        });
      });

      console.log('Google sign-in completed successfully');
      return user;

    } catch (error) {
      console.error('Google sign-in failed:', error);
      
      // Show user-friendly error message
      let message = 'Sign-in failed: ';
      if (error.message.includes('OAuth2 not granted')) {
        message += 'Please set up OAuth2 credentials in Google Cloud Console';
      } else if (error.message.includes('invalid_client')) {
        message += 'Invalid OAuth client configuration';
      } else {
        message += error.message;
      }
      
      alert(message);
      throw error;
    }
  }

  async signOut() {
    console.log('Starting Google sign-out...');
    
    try {
      // Clear cached token
      if (this.currentUser?.token) {
        chrome.identity.removeCachedAuthToken({ token: this.currentUser.token }, () => {
          console.log('Cached token cleared');
        });
      }

      // Clear from storage
      await new Promise((resolve) => {
        chrome.storage.local.remove('googleUser', () => {
          console.log('User removed from storage');
          this.currentUser = null;
          this.notifyListeners(null);
          resolve();
        });
      });

      console.log('Google sign-out completed');
    } catch (error) {
      console.error('Sign-out error:', error);
    }
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
      const existing = document.querySelector('.google-auth-container');
      if (existing) {
        existing.remove();
      }

      // Create auth container
      const authContainer = document.createElement('div');
      authContainer.className = 'google-auth-container';
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
          
          // Google user avatar
          const avatar = document.createElement('img');
          avatar.src = user.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=4285f4&color=fff&size=32';
          avatar.style.cssText = `
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 1px solid #ddd;
          `;
          avatar.title = `${user.name} (${user.email})`;
          
          // User name (show real Google name)
          const nameSpan = document.createElement('span');
          nameSpan.textContent = user.name;
          nameSpan.style.cssText = 'font-size: 12px; color: #333; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
          
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
          userInfo.appendChild(nameSpan);
          userInfo.appendChild(signOutBtn);
          authContainer.appendChild(userInfo);
          
        } else {
          // Signed out state
          const signInBtn = document.createElement('button');
          signInBtn.innerHTML = '🔑 Sign in with Google';
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
            display: flex;
            align-items: center;
            gap: 4px;
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
            
            // Show loading state
            signInBtn.innerHTML = '⏳ Signing in...';
            signInBtn.disabled = true;
            
            this.signIn().catch(error => {
              console.error('Sign in failed:', error);
              // Reset button
              signInBtn.innerHTML = '🔑 Sign in with Google';
              signInBtn.disabled = false;
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

  // Save user prompts with real Google user ID
  async saveUserPrompt(prompt) {
    if (!this.currentUser) return false;
    
    const userPrompts = await this.getUserPrompts();
    userPrompts.push({
      ...prompt,
      savedAt: new Date().toISOString(),
      userId: this.currentUser.id,
      userEmail: this.currentUser.email
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
window.authModule = new GoogleAuthModule();
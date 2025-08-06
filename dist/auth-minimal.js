// Minimal Auth Module for Testing (No Firebase, No OAuth)
// This creates a simple sign-in flow for testing the UI

class MinimalAuth {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    console.log('MinimalAuth: Starting initialization...');
    this.init();
  }

  init() {
    // Check for existing user
    chrome.storage.local.get(['testUser'], (result) => {
      if (result.testUser) {
        console.log('MinimalAuth: Found existing user:', result.testUser);
        this.currentUser = result.testUser;
        this.notifyListeners(this.currentUser);
      } else {
        console.log('MinimalAuth: No existing user found');
      }
      
      // Inject UI after checking storage
      this.injectUI();
    });
  }

  async signIn() {
    console.log('MinimalAuth: Sign in started');
    
    try {
      // Create test user
      const testUser = {
        id: 'test-' + Date.now(),
        email: 'test@example.com',
        name: 'Test User',
        picture: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0Mjg1RjQiLz4KPHRLEHRCT180JSUgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSI+VDwvdGV4dD4KPC9zdmc+',
        signedInAt: new Date().toISOString()
      };

      console.log('MinimalAuth: Creating test user:', testUser);

      // Save to storage
      await new Promise((resolve) => {
        chrome.storage.local.set({ testUser }, () => {
          console.log('MinimalAuth: User saved to storage');
          this.currentUser = testUser;
          this.notifyListeners(testUser);
          resolve();
        });
      });

      console.log('MinimalAuth: Sign in completed successfully');
      return testUser;

    } catch (error) {
      console.error('MinimalAuth: Sign in failed:', error);
      throw error;
    }
  }

  async signOut() {
    console.log('MinimalAuth: Sign out started');
    
    return new Promise((resolve) => {
      chrome.storage.local.remove('testUser', () => {
        console.log('MinimalAuth: User removed from storage');
        this.currentUser = null;
        this.notifyListeners(null);
        resolve();
      });
    });
  }

  onAuthStateChange(callback) {
    console.log('MinimalAuth: Adding auth state listener');
    this.authListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(user) {
    console.log('MinimalAuth: Notifying', this.authListeners.length, 'listeners. User:', user ? 'signed in' : 'signed out');
    this.authListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('MinimalAuth: Listener error:', error);
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
    console.log('MinimalAuth: Starting UI injection...');
    
    const tryInject = () => {
      const headerActions = document.querySelector('.header-actions');
      if (!headerActions) {
        console.log('MinimalAuth: Header not found, retrying in 200ms...');
        setTimeout(tryInject, 200);
        return;
      }

      console.log('MinimalAuth: Header found, creating auth UI');

      // Remove existing auth container if any
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
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 2px;
      `;

      const updateUI = (user) => {
        console.log('MinimalAuth: Updating UI for user:', user ? user.email : 'none');
        authContainer.innerHTML = '';

        if (user) {
          // Signed in state
          const userDiv = document.createElement('div');
          userDiv.style.cssText = 'display: flex; align-items: center; gap: 6px; padding: 2px 6px;';
          
          // Avatar
          const avatar = document.createElement('img');
          avatar.src = user.picture;
          avatar.style.cssText = 'width: 20px; height: 20px; border-radius: 50%;';
          avatar.title = user.email;
          
          // Name
          const nameSpan = document.createElement('span');
          nameSpan.textContent = user.name;
          nameSpan.style.cssText = 'font-size: 12px; color: #333;';
          
          // Sign out button
          const signOutBtn = document.createElement('button');
          signOutBtn.innerHTML = '×';
          signOutBtn.title = 'Sign Out';
          signOutBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            color: #666;
            padding: 0 4px;
          `;
          signOutBtn.onclick = (e) => {
            e.preventDefault();
            console.log('MinimalAuth: Sign out clicked');
            this.signOut();
          };
          
          userDiv.appendChild(avatar);
          userDiv.appendChild(nameSpan);
          userDiv.appendChild(signOutBtn);
          authContainer.appendChild(userDiv);
          
        } else {
          // Signed out state
          const signInBtn = document.createElement('button');
          signInBtn.innerHTML = '🔑 Sign In';
          signInBtn.style.cssText = `
            background: #4285f4;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
          `;
          signInBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('MinimalAuth: Sign in button clicked');
            this.signIn().catch(error => {
              console.error('MinimalAuth: Sign in error:', error);
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
        console.log('MinimalAuth: Auth UI inserted into DOM');
      } else {
        console.log('MinimalAuth: Settings button not found, appending to header');
        headerActions.appendChild(authContainer);
      }

      // Listen for auth state changes
      this.onAuthStateChange(updateUI);
    };

    // Start injection
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryInject);
    } else {
      tryInject();
    }
  }
}

// Create global instance
console.log('MinimalAuth: Creating global instance...');
window.authModule = new MinimalAuth();

// Also make it available for debugging
window.testAuth = window.authModule;
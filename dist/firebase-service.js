// Firebase Integration for Veo 3 Prompt Assistant
// Firebase configuration for Veo 3 Prompt Assistant
// You'll need to replace these with your actual Firebase project credentials

const firebaseConfig = {
  apiKey: "AIzaSyCDsAJx-JUCuKC1-YR16N7APYpTh--SSLo",
  authDomain: "videoprompter-d6a18.firebaseapp.com",
  projectId: "videoprompter-d6a18",
  storageBucket: "videoprompter-d6a18.firebasestorage.app",
  messagingSenderId: "43646976330",
  appId: "1:43646976330:web:6d57b38a3f6c98d4c2c1b3"
};

// Instructions to get these values:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing one
// 3. Click on the gear icon > Project settings
// 4. Under "Your apps" section, create a web app
// 5. Copy the configuration values here

// Firebase service for managing prompts


class FirebaseService {
  constructor() {
    this.db = null;
    this.prompts = [];
    this.categories = [];
    this.unsubscribe = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load Firebase SDK dynamically
      await this.loadFirebaseSDK();
      
      // Initialize Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      
      this.db = firebase.firestore();
      this.initialized = true;
      
      // Enable offline persistence
      await this.db.enablePersistence().catch(err => {
        console.warn('Firebase persistence failed:', err);
      });
      
      return true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      return false;
    }
  }

  async loadFirebaseSDK() {
    // Load Firebase scripts
    const scripts = [
      'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js'
    ];

    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  }

  // Subscribe to real-time prompt updates
  subscribeToPrompts(callback) {
    if (!this.db) {
      console.error('Firebase not initialized');
      return;
    }

    // Listen to prompts collection
    this.unsubscribe = this.db.collection('prompts')
      .orderBy('category')
      .orderBy('order', 'asc')
      .onSnapshot(
        (snapshot) => {
          const prompts = [];
          snapshot.forEach((doc) => {
            prompts.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          this.prompts = prompts;
          callback(prompts);
          
          // Cache prompts locally for offline access
          chrome.storage.local.set({ 
            cachedPrompts: prompts,
            lastSync: Date.now()
          });
        },
        (error) => {
          console.error('Firebase subscription error:', error);
          // Fall back to cached prompts
          this.loadCachedPrompts(callback);
        }
      );
  }

  // Load cached prompts for offline access
  async loadCachedPrompts(callback) {
    const result = await chrome.storage.local.get(['cachedPrompts']);
    if (result.cachedPrompts) {
      this.prompts = result.cachedPrompts;
      callback(result.cachedPrompts);
    }
  }

  // Get all categories
  async getCategories() {
    if (!this.db) return [];
    
    try {
      const snapshot = await this.db.collection('categories').orderBy('order').get();
      const categories = [];
      snapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return categories;
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [
        { id: 'ads', name: 'Ads', icon: '📺', description: 'Commercial & promotional content' },
        { id: 'storytelling', name: 'Storytelling', icon: '📖', description: 'Narrative & cinematic content' },
        { id: 'tutorial', name: 'Tutorial', icon: '🎓', description: 'Educational & how-to content' },
        { id: 'vlogging', name: 'Vlogging', icon: '🎥', description: 'Personal & lifestyle content' },
        { id: 'street-interview', name: 'Street Interview', icon: '🎤', description: 'Urban documentary style' },
        { id: 'tech-influencer', name: 'Tech Influencer', icon: '💻', description: 'Tech reviews & announcements' },
        { id: 'mobile-game', name: 'Mobile Game', icon: '🎮', description: 'Game advertisements' }
      ];
    }
  }

  // Cleanup subscription
  unsubscribeFromPrompts() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // Check if using Firebase or fallback to local file
  async isFirebaseEnabled() {
    // Check if Firebase config has actual values (not placeholders)
    return firebaseConfig.apiKey !== 'YOUR_API_KEY' && 
           firebaseConfig.projectId !== 'YOUR_PROJECT_ID';
  }
}

// Export singleton instance
const firebaseService = new FirebaseService();

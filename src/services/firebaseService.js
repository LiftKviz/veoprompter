// Firebase service for managing prompts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, orderBy, query, onSnapshot, getDocs, enablePersistentCaching } from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config.js';

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
      // Initialize Firebase
      const apps = getApps();
      const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
      
      this.db = getFirestore(app);
      this.initialized = true;
      
      // Enable offline persistence
      try {
        await enablePersistentCaching(this.db);
      } catch (err) {
        console.warn('Firebase persistence failed:', err);
      }
      
      return true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      return false;
    }
  }

  // Subscribe to real-time prompt updates
  subscribeToPrompts(callback) {
    if (!this.db) {
      console.error('Firebase not initialized');
      return;
    }

    // Listen to prompts collection
    const promptsCollection = collection(this.db, 'prompts');
    const promptsQuery = query(promptsCollection, orderBy('category'), orderBy('order', 'asc'));
    
    this.unsubscribe = onSnapshot(
      promptsQuery,
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
      const categoriesCollection = collection(this.db, 'categories');
      const categoriesQuery = query(categoriesCollection, orderBy('order'));
      const snapshot = await getDocs(categoriesQuery);
      
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
export const firebaseService = new FirebaseService();
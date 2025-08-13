// Firebase service for managing prompts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, orderBy, query, onSnapshot, getDocs, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config.js';

class FirebaseService {
  constructor() {
    this.db = null;
    this.prompts = [];
    this.categories = [];
    this.unsubscribe = null;
    this.initialized = false;
  }

  // Getter for the database instance
  get database() {
    return this.db;
  }

  // Getter for Firebase apps
  getApps() {
    return getApps();
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔧 Initializing Firebase...');
      console.log('🔧 Firebase config:', firebaseConfig);
      
      // Initialize Firebase
      const apps = getApps();
      console.log('🔧 Existing Firebase apps:', apps.length);
      
      const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
      console.log('🔧 Firebase app initialized:', app.name);
      
      this.db = getFirestore(app);
      
      // Configure offline persistence using newer API
      try {
        // Note: In newer Firebase versions, persistence is enabled by default
        console.log('🔧 Firebase persistence is enabled by default');
      } catch (err) {
        console.warn('Firebase persistence configuration warning:', err);
      }
      
      this.initialized = true;
      
      return true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      return false;
    }
  }

  // Subscribe to real-time prompt updates
  subscribeToPrompts(callback) {
    console.log('📡 Subscribing to Firebase prompts...');
    
    if (!this.db) {
      console.error('❌ Firebase DB not initialized');
      callback([]); // Call with empty array so the promise resolves
      return () => {}; // Return empty unsubscribe function
    }

    // Listen to prompts collection
    const promptsCollection = collection(this.db, 'prompts');
    console.log('📂 Listening to prompts collection...');
    
    try {
      // Simplified query - just order by category (no composite index needed)
      const promptsQuery = query(promptsCollection, orderBy('category'));
      
      const unsubscribeFn = onSnapshot(
        promptsQuery,
        (snapshot) => {
          const timestamp = new Date().toLocaleTimeString();
          console.log(`📸 [${timestamp}] Firebase snapshot received: ${snapshot.size} documents, empty: ${snapshot.empty}`);
          
          const prompts = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Only log first document to reduce noise
            if (prompts.length === 0) {
              console.log(`📄 First document ${doc.id}:`, data);
            }
            prompts.push({
              id: doc.id,
              ...data
            });
          });
          
          this.prompts = prompts;
          console.log(`🔥 [${timestamp}] Firebase real-time update: ${prompts.length} prompts received`);
          console.log(`📢 [${timestamp}] Calling callback with ${prompts.length} prompts`);
          callback(prompts);
          
          // Cache prompts locally for offline access
          if (prompts.length > 0) {
            chrome.storage.local.set({ 
              cachedPrompts: prompts,
              lastSync: Date.now()
            });
          }
        },
        (error) => {
          console.error('❌ Firebase subscription error:', error);
          console.error('Error details:', error.code, error.message);
          // Fall back to cached prompts
          this.loadCachedPrompts(callback);
        }
      );
      
      // Store unsubscribe function
      this.unsubscribe = unsubscribeFn;
      
      // Return unsubscribe function for the caller
      return unsubscribeFn;
    } catch (error) {
      console.error('❌ Failed to create Firebase query:', error);
      callback([]);
      return () => {};
    }
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
export default firebaseService;
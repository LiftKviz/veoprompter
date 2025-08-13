import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseService from './firebaseService.js';

let auth = null;
let db = null;
const googleProvider = new GoogleAuthProvider();

// Auth service class
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.initialized = false;
    this.initializeFirebase();
  }

  // Initialize Firebase and auth
  async initializeFirebase() {
    if (this.initialized) return;
    
    try {
      await firebaseService.initialize();
      
      // Get Firebase app instance from firebaseService
      const apps = firebaseService.getApps ? firebaseService.getApps() : [];
      const app = apps.length > 0 ? apps[0] : null;
      
      if (!app) {
        console.error('No Firebase app found after initialization');
        return;
      }
      
      auth = getAuth(app);
      db = firebaseService.database;
      this.initialized = true;
      
      // Now initialize auth listener
      this.initAuthListener();
    } catch (error) {
      console.error('Failed to initialize Firebase in AuthService:', error);
    }
  }

  // Initialize auth state listener
  initAuthListener() {
    if (!auth) {
      console.warn('Auth not initialized yet, skipping auth listener setup');
      return;
    }
    
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        // Update user data in Firestore
        await this.updateUserData(user);
      }
      
      // Notify all listeners
      this.authStateListeners.forEach(listener => listener(user));
    });
  }

  // Add auth state listener
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(listener => listener !== callback);
    };
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      // Ensure Firebase is initialized
      await this.initializeFirebase();
      
      // For Chrome extensions, we need to use chrome.identity API
      // This is a fallback for web/popup usage
      if (typeof chrome !== 'undefined' && chrome.identity) {
        return this.signInWithChromeIdentity();
      }
      
      // Regular web sign-in
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  // Chrome extension specific sign-in
  async signInWithChromeIdentity() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        try {
          // Exchange Chrome identity token for Firebase auth
          const credential = GoogleAuthProvider.credential(null, token);
          const result = await signInWithCredential(auth, credential);
          resolve(result.user);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Update user data in Firestore
  async updateUserData(user) {
    await this.initializeFirebase();
    if (!db) {
      console.warn('Database not initialized, skipping user data update');
      return;
    }
    
    const userRef = doc(db, 'users', user.uid);
    
    try {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Check if user exists
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // New user - add created timestamp
        userData.createdAt = serverTimestamp();
        userData.savedPrompts = [];
        userData.customPrompts = [];
        userData.preferences = {
          theme: 'light',
          defaultCategory: 'all'
        };
      }

      await setDoc(userRef, userData, { merge: true });
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    try {
      await this.initializeFirebase();
      if (!auth) {
        console.warn('Auth not initialized, skipping Firebase sign out');
        return;
      }
      
      await signOut(auth);
      
      // Clear Chrome identity token if in extension
      if (typeof chrome !== 'undefined' && chrome.identity) {
        chrome.identity.removeCachedAuthToken({ token: '' }, () => {
          console.log('Chrome identity token cleared');
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Get auth instance (for advanced usage)
  getAuth() {
    return auth;
  }

  // Get Firestore instance (for advanced usage)
  getFirestore() {
    return db;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
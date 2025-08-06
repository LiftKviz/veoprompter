import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Auth service class
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.initAuthListener();
  }

  // Initialize auth state listener
  initAuthListener() {
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
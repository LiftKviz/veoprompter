// Firebase Integration for User Data Storage
// This module connects Chrome auth with Firebase Firestore

class FirebaseAuthIntegration {
  constructor() {
    this.db = null;
    this.auth = null;
    this.currentFirebaseUser = null;
    this.initializeFirebase();
  }

  initializeFirebase() {
    // Wait for Firebase to be ready
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      this.db = firebase.firestore();
      this.auth = firebase.auth();
      console.log('Firebase already initialized');
    } else {
      // Listen for Firebase ready event
      window.addEventListener('firebaseReady', () => {
        if (typeof firebase !== 'undefined') {
          this.db = firebase.firestore();
          this.auth = firebase.auth();
          console.log('Firebase initialized after ready event');
        }
      });
    }
  }

  // Link Chrome user with Firebase
  async linkChromeUserToFirebase(chromeUser) {
    if (!this.db) {
      console.error('Firebase not initialized');
      return null;
    }

    try {
      // Create or update user document in Firestore
      const userRef = this.db.collection('users').doc(chromeUser.id);
      
      const userData = {
        uid: chromeUser.id,
        email: chromeUser.email,
        displayName: chromeUser.name,
        photoURL: chromeUser.picture,
        provider: 'chrome.identity',
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Check if user exists
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        // New user
        userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        userData.savedPrompts = [];
        userData.customPrompts = [];
        userData.sequences = [];
        userData.preferences = {
          theme: 'light',
          defaultCategory: 'all',
          lastViewedCategory: null
        };
      }

      // Update user data
      await userRef.set(userData, { merge: true });
      
      // Get the updated user data
      const updatedDoc = await userRef.get();
      return updatedDoc.data();
    } catch (error) {
      console.error('Error linking Chrome user to Firebase:', error);
      return null;
    }
  }

  // Save user prompt to Firebase
  async saveUserPrompt(userId, prompt) {
    if (!this.db || !userId) return false;

    try {
      const userRef = this.db.collection('users').doc(userId);
      const promptsRef = userRef.collection('prompts').doc();
      
      const promptData = {
        ...prompt,
        id: promptsRef.id,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await promptsRef.set(promptData);
      
      // Also add to user's savedPrompts array for quick access
      await userRef.update({
        savedPrompts: firebase.firestore.FieldValue.arrayUnion(promptsRef.id),
        lastActivity: firebase.firestore.FieldValue.serverTimestamp()
      });

      return promptData;
    } catch (error) {
      console.error('Error saving prompt to Firebase:', error);
      return false;
    }
  }

  // Get user's saved prompts from Firebase
  async getUserPrompts(userId) {
    if (!this.db || !userId) return [];

    try {
      const promptsSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('prompts')
        .orderBy('createdAt', 'desc')
        .get();

      return promptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user prompts from Firebase:', error);
      return [];
    }
  }

  // Save user sequence to Firebase
  async saveUserSequence(userId, sequence) {
    if (!this.db || !userId) return false;

    try {
      const userRef = this.db.collection('users').doc(userId);
      const sequencesRef = userRef.collection('sequences').doc();
      
      const sequenceData = {
        ...sequence,
        id: sequencesRef.id,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await sequencesRef.set(sequenceData);
      
      // Update user's sequences array
      await userRef.update({
        sequences: firebase.firestore.FieldValue.arrayUnion(sequencesRef.id),
        lastActivity: firebase.firestore.FieldValue.serverTimestamp()
      });

      return sequenceData;
    } catch (error) {
      console.error('Error saving sequence to Firebase:', error);
      return false;
    }
  }

  // Get user's sequences from Firebase
  async getUserSequences(userId) {
    if (!this.db || !userId) return [];

    try {
      const sequencesSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('sequences')
        .orderBy('createdAt', 'desc')
        .get();

      return sequencesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user sequences from Firebase:', error);
      return [];
    }
  }

  // Update user preferences
  async updateUserPreferences(userId, preferences) {
    if (!this.db || !userId) return false;

    try {
      const userRef = this.db.collection('users').doc(userId);
      
      await userRef.update({
        preferences: preferences,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  // Get user data from Firebase
  async getUserData(userId) {
    if (!this.db || !userId) return null;

    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user data from Firebase:', error);
      return null;
    }
  }

  // Delete user prompt
  async deleteUserPrompt(userId, promptId) {
    if (!this.db || !userId || !promptId) return false;

    try {
      // Delete from prompts collection
      await this.db
        .collection('users')
        .doc(userId)
        .collection('prompts')
        .doc(promptId)
        .delete();

      // Remove from savedPrompts array
      const userRef = this.db.collection('users').doc(userId);
      await userRef.update({
        savedPrompts: firebase.firestore.FieldValue.arrayRemove(promptId),
        lastActivity: firebase.firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error deleting prompt:', error);
      return false;
    }
  }
}

// Create global instance
window.firebaseAuthIntegration = new FirebaseAuthIntegration();

// Connect with auth module if it exists
if (window.authModule) {
  // Listen for auth state changes
  window.authModule.onAuthStateChange(async (chromeUser) => {
    if (chromeUser) {
      // Link Chrome user to Firebase
      const firebaseUser = await window.firebaseAuthIntegration.linkChromeUserToFirebase(chromeUser);
      console.log('User linked to Firebase:', firebaseUser);
      
      // Override the save functions to use Firebase
      const originalSavePrompt = window.authModule.saveUserPrompt.bind(window.authModule);
      window.authModule.saveUserPrompt = async (prompt) => {
        // Save to both local Chrome storage and Firebase
        await originalSavePrompt(prompt);
        return await window.firebaseAuthIntegration.saveUserPrompt(chromeUser.id, prompt);
      };

      // Override get prompts to fetch from Firebase
      window.authModule.getUserPrompts = async () => {
        return await window.firebaseAuthIntegration.getUserPrompts(chromeUser.id);
      };
    }
  });
}
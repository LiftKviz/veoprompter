/**
 * Subscription Sync Service
 * Syncs ExtPay subscription data with Firebase for admin tracking
 */

import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { paymentService } from './paymentService';
import firebaseService from './firebaseService';

export interface FirebaseSubscription {
  userId: string;
  email?: string;
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'free';
  plan: 'free' | 'pro';
  paid: boolean;
  paidAt?: Date;
  installedAt: Date;
  trialStartedAt?: Date;
  lastSync: Date;
  extPayData?: any; // Raw ExtPay user data for reference
  createdAt: Date;
  updatedAt: Date;
}

class SubscriptionSyncService {
  private db: any = null;
  private syncInProgress = false;

  private async ensureFirebaseInitialized() {
    if (!this.db) {
      await firebaseService.initialize();
      this.db = firebaseService.database;
    }
  }

  /**
   * Sync current user's subscription status with Firebase
   */
  async syncUserSubscription(userId: string): Promise<void> {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      console.log('🔄 Syncing subscription for user:', userId);
      
      // Ensure Firebase is initialized
      await this.ensureFirebaseInitialized();
      
      // Get current user's ExtPay data
      const extPayUser = await paymentService.getUser();
      
      // Get current user's email from Chrome storage
      const stored = await chrome.storage.local.get(['user']);
      const userEmail = stored.user?.email;
      
      if (!userEmail) {
        console.log('📭 No user email found, skipping subscription sync (user not signed in)');
        return;
      }
      
      // Prepare subscription data for Firebase
      const subscriptionData: FirebaseSubscription = {
        userId,
        email: userEmail,
        subscriptionStatus: extPayUser.paid ? 
          (extPayUser.subscriptionStatus || 'active') : 'free',
        plan: extPayUser.paid ? 'pro' : 'free',
        paid: extPayUser.paid,
        paidAt: extPayUser.paidAt,
        installedAt: extPayUser.installedAt,
        trialStartedAt: extPayUser.trialStartedAt,
        lastSync: new Date(),
        extPayData: extPayUser, // Store raw ExtPay data for reference
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Check if subscription record exists
      const subscriptionRef = doc(this.db, 'subscriptions', userId);
      const existingDoc = await getDoc(subscriptionRef);
      
      if (existingDoc.exists()) {
        // Update existing record, preserve createdAt
        const existingData = existingDoc.data();
        subscriptionData.createdAt = existingData.createdAt;
        subscriptionData.updatedAt = new Date();
      }
      
      // Save to Firebase
      await setDoc(subscriptionRef, {
        ...subscriptionData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Subscription synced successfully:', {
        userId,
        email: userEmail,
        plan: subscriptionData.plan,
        paid: subscriptionData.paid
      });
      
    } catch (error) {
      console.error('❌ Failed to sync subscription:', error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Get subscription data from Firebase
   */
  async getSubscription(userId: string): Promise<FirebaseSubscription | null> {
    try {
      await this.ensureFirebaseInitialized();
      const subscriptionRef = doc(this.db, 'subscriptions', userId);
      const existingDoc = await getDoc(subscriptionRef);
      
      if (existingDoc.exists()) {
        return existingDoc.data() as FirebaseSubscription;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get subscription:', error);
      return null;
    }
  }
  
  /**
   * Get all subscriptions (admin only)
   */
  async getAllSubscriptions(): Promise<FirebaseSubscription[]> {
    try {
      await this.ensureFirebaseInitialized();
      const subscriptionsCollection = collection(this.db, 'subscriptions');
      const snapshot = await getDocs(subscriptionsCollection);
      
      const subscriptions: FirebaseSubscription[] = [];
      snapshot.forEach((doc) => {
        subscriptions.push({
          ...doc.data(),
          userId: doc.id
        } as FirebaseSubscription);
      });
      
      // Sort by most recent
      return subscriptions.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('❌ Failed to get all subscriptions:', error);
      return [];
    }
  }
  
  /**
   * Get active subscribers count
   */
  async getActiveSubscribersCount(): Promise<number> {
    try {
      await this.ensureFirebaseInitialized();
      const subscriptionsCollection = collection(this.db, 'subscriptions');
      const activeQuery = query(
        subscriptionsCollection, 
        where('paid', '==', true),
        where('subscriptionStatus', '==', 'active')
      );
      
      const snapshot = await getDocs(activeQuery);
      return snapshot.size;
    } catch (error) {
      console.error('❌ Failed to get active subscribers count:', error);
      return 0;
    }
  }
  
  /**
   * Auto-sync when user signs in or payment status changes
   */
  async setupAutoSync(userId: string): Promise<void> {
    // Sync on payment status changes
    paymentService.onPaid(() => {
      console.log('💰 Payment detected, syncing subscription...');
      this.syncUserSubscription(userId);
    });
    
    // Initial sync
    await this.syncUserSubscription(userId);
    
    // Periodic sync (every 5 minutes)
    setInterval(() => {
      this.syncUserSubscription(userId);
    }, 5 * 60 * 1000);
  }
}

export const subscriptionSyncService = new SubscriptionSyncService();
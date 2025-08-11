/**
 * React hook for authentication and access control
 */

import { useState, useEffect } from 'react';
import { authService, UserState, FeatureAccess } from '@/services/authService';

export interface UseAuthReturn {
  userState: UserState;
  featureAccess: FeatureAccess;
  isLoading: boolean;
  canAccess: (feature: keyof FeatureAccess) => boolean;
  getUpgradeMessage: (feature: keyof FeatureAccess) => string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  trackModification: () => Promise<boolean>;
  getRemainingModifications: () => number;
}

export function useAuth(): UseAuthReturn {
  const [userState, setUserState] = useState<UserState>(authService.getUserState());
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess>(authService.getFeatureAccess());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((newState) => {
      setUserState(newState);
      setFeatureAccess(authService.getFeatureAccess());
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const trackModification = async () => {
    return authService.trackModification();
  };

  const getRemainingModifications = () => {
    return authService.getRemainingModifications();
  };

  return {
    userState,
    featureAccess,
    isLoading,
    canAccess: (feature) => authService.canAccess(feature),
    getUpgradeMessage: (feature) => authService.getUpgradeMessage(feature),
    signIn,
    signOut,
    trackModification,
    getRemainingModifications
  };
}
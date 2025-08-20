/**
 * Prompt Data Service
 * Loads prompts from admin dashboard, Firebase, or local file
 */

import { Prompt, CategoryType } from '@/types';
import firebaseService from './firebaseService';

export interface AdminPrompt {
  category: string;
  title: string;
  prompt: string;
  youtubeLink?: string;
  order?: number;
  customFields?: any;
}

class PromptDataService {
  private prompts: Prompt[] = [];
  private loaded = false;
  private unsubscribe: (() => void) | null = null;
  private updateCallbacks: Set<(prompts: Prompt[]) => void> = new Set();

  /**
   * Initialize and load prompts from best available source
   */
  async initialize(): Promise<Prompt[]> {
    console.log('🔄 Starting prompt data initialization...');
    
    // Try Firebase first for real-time sync
    try {
      console.log('🔥 Trying Firebase for real-time sync...');
      const firebasePrompts = await this.loadFromFirebase();
      if (firebasePrompts.length > 0) {
        console.log(`✅ Loaded ${firebasePrompts.length} prompts from Firebase with real-time sync`);
        this.prompts = firebasePrompts;
        this.loaded = true;
        return firebasePrompts;
      }
    } catch (error) {
      console.warn('⚠️ Firebase failed, trying fallbacks:', error);
    }
    
    // Fallback to admin dashboard static JSON
    try {
      console.log('📊 Trying admin dashboard static data...');
      const adminPrompts = await this.loadFromAdminDashboard();
      if (adminPrompts.length > 0) {
        console.log(`✅ Loaded ${adminPrompts.length} prompts from admin dashboard (static)`);
        this.prompts = adminPrompts;
        this.loaded = true;
        return adminPrompts;
      }
    } catch (error) {
      console.warn('❌ Admin dashboard failed:', error);
    }

    // Fallback to local prompts.txt
    try {
      console.log('📋 Falling back to prompts.txt...');
      const txtPrompts = await this.loadFromPromptsFile();
      console.log(`✅ Loaded ${txtPrompts.length} prompts from prompts.txt`);
      this.prompts = txtPrompts;
      this.loaded = true;
      return txtPrompts;
    } catch (error) {
      console.error('❌ All data sources failed:', error);
      const defaultPrompts = this.getDefaultPrompts();
      this.prompts = defaultPrompts;
      this.loaded = true;
      return defaultPrompts;
    }
  }

  /**
   * Load prompts from Firebase
   */
  async loadFromFirebase(): Promise<Prompt[]> {
    try {
      // Initialize Firebase if not already done
      await firebaseService.initialize();
      
      return new Promise((resolve, reject) => {
        let resolved = false;
        
        // Set a timeout to reject if no data comes
        const timeout = setTimeout(() => {
          if (!resolved) {
            console.warn('⏱️ Firebase timeout - no data received within 5 seconds');
            resolved = true;
            reject(new Error('Firebase timeout'));
          }
        }, 5000);
        
        // Subscribe to real-time updates
        this.unsubscribe = firebaseService.subscribeToPrompts((firebasePrompts: any[]) => {
          if (!firebasePrompts) {
            console.warn('📭 Firebase returned null/undefined prompts');
            if (!resolved) {
              clearTimeout(timeout);
              resolved = true;
              resolve([]);
            }
            return;
          }
          
          console.log(`🔥 Firebase raw data:`, firebasePrompts);
          
          this.prompts = firebasePrompts.map((p, index) => ({
            id: p.id || `firebase-${index + 1}`,
            category: p.category as CategoryType,
            title: p.title,
            prompt: p.prompt,
            youtubeLink: p.youtubeLink,
            dateAdded: p.dateAdded || new Date().toISOString(),
            isCustom: false
          }));
          
          this.loaded = true;
          console.log(`🔄 Firebase update: ${this.prompts.length} prompts processed`);
          
          // Notify all subscribers of the update
          this.notifySubscribers();
          
          // Resolve on first load
          if (!resolved) {
            clearTimeout(timeout);
            resolved = true;
            resolve(this.prompts);
          }
        });
      });
    } catch (error) {
      console.warn('Failed to load from Firebase:', error);
      return [];
    }
  }

  /**
   * Subscribe to prompt updates
   */
  subscribeToUpdates(callback: (prompts: Prompt[]) => void): () => void {
    this.updateCallbacks.add(callback);
    
    // If we already have prompts loaded, call the callback immediately
    if (this.loaded && this.prompts.length > 0) {
      callback(this.prompts);
    }
    
    // Ensure Firebase is initialized and listening
    if (!this.unsubscribe && !this.loaded) {
      console.log('🔄 Late subscriber detected, initializing Firebase...');
      this.initialize().catch(err => {
        console.error('Failed to initialize for late subscriber:', err);
      });
    }
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of prompt updates
   */
  private notifySubscribers() {
    this.updateCallbacks.forEach(callback => {
      callback(this.prompts);
    });
  }

  /**
   * Load prompts from admin dashboard data file
   */
  async loadFromAdminDashboard(): Promise<Prompt[]> {
    // Try to load the admin dashboard prompts JSON data
    const url = chrome.runtime.getURL('admin-dashboard/prompts-data.json');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const jsonData = await response.json();
    console.log('Fetched admin dashboard JSON data');
    
    if (jsonData && jsonData.prompts && Array.isArray(jsonData.prompts)) {
      const promptsData = jsonData.prompts as AdminPrompt[];
      console.log(`Converting ${promptsData.length} admin prompts to internal format`);
      
      const convertedPrompts = promptsData.map((p, index) => ({
        id: `admin-${index + 1}`,
        category: p.category as CategoryType,
        title: p.title,
        prompt: p.prompt,
        youtubeLink: p.youtubeLink,
        dateAdded: new Date().toISOString(),
        isCustom: false
      }));
      
      console.log(`✅ Successfully converted ${convertedPrompts.length} prompts`);
      return convertedPrompts;
    } else {
      throw new Error('Invalid JSON structure - prompts not found or not array');
    }
  }

  /**
   * Load prompts from prompts.txt file
   */
  async loadFromPromptsFile(): Promise<Prompt[]> {
    const url = chrome.runtime.getURL('data/prompts.txt');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    
    const lines = text.split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    );

    const convertedPrompts = lines.map((line, index) => {
      const [category, title, prompt, youtubeLink] = line.split('|').map(s => s.trim());
      return {
        id: `prompt-${index + 1}`,
        category: category as CategoryType,
        title,
        prompt,
        youtubeLink: youtubeLink || undefined,
        dateAdded: new Date().toISOString(),
        isCustom: false
      };
    }).filter(p => p.title && p.prompt);

    console.log(`✅ Successfully parsed ${convertedPrompts.length} prompts from prompts.txt`);
    return convertedPrompts;
  }

  /**
   * Get all loaded prompts
   */
  async getPrompts(): Promise<Prompt[]> {
    if (!this.loaded) {
      await this.initialize();
    }
    return this.prompts;
  }

  /**
   * Get prompts by category
   */
  async getPromptsByCategory(category: CategoryType): Promise<Prompt[]> {
    const allPrompts = await this.getPrompts();
    
    if (category === 'all') {
      return allPrompts;
    }
    
    if (category === 'my-prompts') {
      // Load saved prompts from Chrome storage
      const result = await chrome.storage.local.get(['savedPrompts']);
      return result.savedPrompts || [];
    }
    
    return allPrompts.filter(p => p.category === category);
  }

  /**
   * Search prompts
   */
  async searchPrompts(query: string): Promise<Prompt[]> {
    const allPrompts = await this.getPrompts();
    const lowerQuery = query.toLowerCase();
    
    return allPrompts.filter(p => 
      p.title.toLowerCase().includes(lowerQuery) ||
      p.prompt.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get default fallback prompts
   */
  private getDefaultPrompts(): Prompt[] {
    return [
      {
        id: 'default-1',
        category: 'ads',
        title: 'Product Launch Teaser',
        prompt: 'Create a 30-second teaser video for a new tech product launch.',
        dateAdded: new Date().toISOString(),
        isCustom: false
      },
      {
        id: 'default-2',
        category: 'storytelling',
        title: 'Mystery Opening',
        prompt: 'Create an opening scene for a mystery short film.',
        dateAdded: new Date().toISOString(),
        isCustom: false
      },
      {
        id: 'default-3',
        category: 'tutorial',
        title: 'Cooking Tutorial',
        prompt: 'Film a cooking tutorial with overhead shots.',
        dateAdded: new Date().toISOString(),
        isCustom: false
      },
      {
        id: 'default-4',
        category: 'vlogging',
        title: 'Day in My Life',
        prompt: 'Film a "day in my life" vlog.',
        dateAdded: new Date().toISOString(),
        isCustom: false
      }
    ];
  }

  /**
   * Reload prompts (useful for refreshing data)
   */
  async reload(): Promise<Prompt[]> {
    this.loaded = false;
    this.prompts = [];
    
    // Unsubscribe from Firebase if active
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    return this.initialize();
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    firebaseService.unsubscribeFromPrompts();
  }
}

// Export singleton instance
export const promptDataService = new PromptDataService();
export default promptDataService;
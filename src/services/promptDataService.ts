/**
 * Prompt Data Service
 * Loads prompts from admin dashboard or Firebase
 */

import { Prompt, CategoryType } from '@/types';

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

  /**
   * Load prompts from admin dashboard data file
   */
  async loadFromAdminDashboard(): Promise<Prompt[]> {
    try {
      // Try to load the admin dashboard prompts data
      const response = await fetch('/admin-dashboard/prompts-data.js');
      const scriptText = await response.text();
      
      // Extract the prompts data from the script
      const match = scriptText.match(/const\s+parsedPrompts\s*=\s*(\[[\s\S]*?\]);/);
      if (match && match[1]) {
        // Parse the JavaScript array
        const promptsData = eval(match[1]) as AdminPrompt[];
        console.log(`Loaded ${promptsData.length} prompts from admin dashboard`);
        
        this.prompts = promptsData.map((p, index) => ({
          id: `prompt-${index + 1}`,
          category: p.category as CategoryType,
          title: p.title,
          prompt: p.prompt,
          youtubeLink: p.youtubeLink,
          dateAdded: new Date().toISOString(),
          isCustom: false
        }));
        
        this.loaded = true;
        return this.prompts;
      }
    } catch (error) {
      console.warn('Failed to load admin dashboard prompts:', error);
    }

    // Fallback to loading from prompts.txt
    return this.loadFromPromptsFile();
  }

  /**
   * Load prompts from prompts.txt file
   */
  async loadFromPromptsFile(): Promise<Prompt[]> {
    try {
      const response = await fetch('/data/prompts.txt');
      const text = await response.text();
      
      const lines = text.split('\n').filter(line => 
        line.trim() && !line.startsWith('#')
      );

      this.prompts = lines.map((line, index) => {
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

      console.log(`Loaded ${this.prompts.length} prompts from prompts.txt`);
      this.loaded = true;
      return this.prompts;
    } catch (error) {
      console.error('Failed to load prompts:', error);
      return this.getDefaultPrompts();
    }
  }

  /**
   * Get all loaded prompts
   */
  async getPrompts(): Promise<Prompt[]> {
    if (!this.loaded) {
      await this.loadFromAdminDashboard();
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
    return this.loadFromAdminDashboard();
  }
}

// Export singleton instance
export const promptDataService = new PromptDataService();
export default promptDataService;
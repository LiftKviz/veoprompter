import { GPTModifyRequest } from '@/types';
import { paymentService } from './paymentService';

const GPT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// Declare SecureStorage for encrypted API key storage
declare const SecureStorage: any;

export class GPTService {
  private static instance: GPTService;
  private apiKey: string | null = null;
  private knowledgeBase: any = null;
  private secureStorage: any = null;

  private constructor() {
    // Initialize SecureStorage if available
    if (typeof SecureStorage !== 'undefined') {
      this.secureStorage = new SecureStorage();
    }
  }

  static getInstance(): GPTService {
    if (!GPTService.instance) {
      GPTService.instance = new GPTService();
    }
    return GPTService.instance;
  }

  private async loadKnowledgeBase(): Promise<any> {
    if (this.knowledgeBase) return this.knowledgeBase;
    
    try {
      const response = await fetch('/data/knowledge-base.json');
      this.knowledgeBase = await response.json();
      return this.knowledgeBase;
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      return null;
    }
  }

  private generateSystemPrompt(_knowledgeBase?: any): string {
    // Reserved for future use when knowledge base is loaded
    // const veoSpecific = _knowledgeBase?.video_knowledge_base?.veo_3_specific;
    
    return `You are an expert AI prompt engineer specializing in Google Veo 3. Transform ideas into prompts using the SSASA framework:

1) SUBJECT: Clearly identify who/what is the focus with specific details (e.g., 'grizzled detective in rumpled trench coat' not 'a man')
2) SCENE: Describe environment in detail - where and when action occurs (e.g., 'dusty attic with afternoon light through grimy window')
3) ACTION: Define what subject is doing with strong verbs, chain actions with 'this happens, then that happens'
4) STYLE: Specify visual aesthetic (e.g., '1990s VHS footage', '8-bit video game', 'claymation', 'filmed on 16mm')
5) AUDIO: Explicitly describe all sounds - dialogue, ambient sounds, SFX, and music (Veo 3's signature feature)

For dialogue, use format: "Character Name says (with emotional tone): 'Exact words.'" - This prevents mixing up speakers.

Include negative prompt (no subtitles, no on-screen text) unless requested. Keep modifications concise and focused on the user's instruction while maintaining Veo 3 best practices.`;
  }

  async setApiKey(key: string): Promise<void> {
    if (!key) {
      // Remove API key
      if (this.secureStorage) {
        await this.secureStorage.removeApiKey();
      } else {
        await chrome.storage.local.remove(['gptApiKey']);
      }
      this.apiKey = null;
      return;
    }

    try {
      if (this.secureStorage) {
        // Use encrypted storage
        await this.secureStorage.storeApiKey(key);
        this.apiKey = key;
      } else {
        // Fallback to plain storage
        this.apiKey = key;
        await chrome.storage.local.set({ gptApiKey: key });
      }
    } catch (error) {
      console.error('Failed to store API key:', error);
      throw error;
    }
  }

  async getApiKey(): Promise<string | null> {
    if (this.apiKey) return this.apiKey;
    
    try {
      if (this.secureStorage) {
        // Try to migrate old unencrypted key first
        await this.secureStorage.migrateOldKey();
        
        // Get encrypted API key
        this.apiKey = await this.secureStorage.getApiKey();
        return this.apiKey;
      } else {
        // Fallback to plain storage
        const result = await chrome.storage.local.get(['gptApiKey']);
        this.apiKey = result.gptApiKey || null;
        return this.apiKey;
      }
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      this.apiKey = null;
      return null;
    }
  }

  async modifyPrompt(request: GPTModifyRequest): Promise<string> {
    // Check payment access first
    const canUseFeature = await paymentService.canUseFeature('gpt_modification');
    if (!canUseFeature) {
      throw new Error('💎 Premium Feature: AI prompt modification requires a Premium subscription. Upgrade to unlock unlimited modifications!');
    }

    // Check usage limits for free users
    const canTrackUsage = await paymentService.trackUsage('gpt_modification');
    if (!canTrackUsage) {
      const remaining = await paymentService.getRemainingUsage('gpt_modification');
      if (remaining === 0) {
        throw new Error('⏰ Daily Limit Reached: You\'ve used all your AI modifications for today. Upgrade to Premium for unlimited access!');
      }
    }

    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('🔑 API key required: Please add your OpenAI API key in settings to use prompt modification features.');
    }

    if (!request.instruction?.trim()) {
      throw new Error('📝 Modification instruction required: Please describe how you want to modify the prompt.');
    }

    // Load knowledge base for enhanced system prompt
    const knowledgeBase = await this.loadKnowledgeBase();
    const systemPrompt = this.generateSystemPrompt(knowledgeBase);

    try {
      const response = await fetch(GPT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Original prompt: "${request.prompt}"\n\nModification instruction: "${request.instruction}"\n\nPlease modify the prompt according to the instruction using the SSASA framework.`
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message;
        
        // Handle specific API errors with actionable messages
        if (response.status === 401) {
          throw new Error('🔐 Invalid API key: Please check your OpenAI API key in settings and ensure it\'s valid.');
        } else if (response.status === 403) {
          throw new Error('🚫 Access denied: Your API key doesn\'t have permission to access GPT-4. Please check your OpenAI account.');
        } else if (response.status === 429) {
          throw new Error('⏰ Rate limit exceeded: Please wait a moment and try again. Consider upgrading your OpenAI plan for higher limits.');
        } else if (response.status === 500) {
          throw new Error('🔧 OpenAI server error: Please try again in a few moments.');
        } else if (response.status >= 400 && response.status < 500) {
          throw new Error(`❌ Request error: ${errorMessage || 'Please check your request and try again.'}`);
        } else {
          throw new Error(`🌐 Network error: ${errorMessage || 'Please check your internet connection and try again.'}`);
        }
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('📭 Empty response: The AI didn\'t generate a response. Please try again with a different instruction.');
      }
      
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('GPT API error:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('🌐 Connection failed: Please check your internet connection and try again.');
      }
      
      // Re-throw custom errors as-is
      throw error;
    }
  }
}
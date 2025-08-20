import { GPTModifyRequest } from '@/types';

// Backend proxy endpoint (server-side holds the OpenAI API key)
const GPT_PROXY_ENDPOINT_PROD = 'https://veoprompter.netlify.app/.netlify/functions/gpt';

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

  async loadKnowledgeBase(): Promise<any> {
    if (this.knowledgeBase) return this.knowledgeBase;
    
    try {
      // In service worker context, use chrome.runtime.getURL for proper path resolution
      const knowledgeBaseUrl = typeof chrome !== 'undefined' && chrome.runtime 
        ? chrome.runtime.getURL('data/knowledge-base.json')
        : '/data/knowledge-base.json';
        
      const response = await fetch(knowledgeBaseUrl);
      this.knowledgeBase = await response.json();
      return this.knowledgeBase;
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      // Return null so the service can still work without knowledge base
      return null;
    }
  }

  generateSystemPrompt(_knowledgeBase?: any): string {
    return `You MUST respond ONLY with valid JSON. No other text.

{
  "prompt": "flowing, narrative Veo 3 video prompt",
  "core_elements": {
    "subject": "who/what",
    "context": "where", 
    "action": "what happens",
    "style": "visual mood"
  },
  "optional_elements": {
    "camera": "movement",
    "dialogue": "speech",
    "sounds": "audio"
  }
}

Write cinematic, flowing prompts that adapt to different contexts (ads, interviews, home videos, sketches, etc.). Be flexible and logical - don't copy inappropriate details from one context to another. CRITICAL: Follow user instructions exactly - implement every requested change. JSON format only.`;
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
    // No user API key required. Requests are routed through a secure backend proxy.
    // Note: Usage checking is handled by individual callers (background script for floating buttons, popup for direct calls)

    if (!request.instruction?.trim()) {
      throw new Error('📝 Modification instruction required: Please describe how you want to modify the prompt.');
    }

    // Load knowledge base for enhanced system prompt
    const knowledgeBase = await this.loadKnowledgeBase();
    const systemPrompt = this.generateSystemPrompt(knowledgeBase);

    try {
      let response = await fetch(GPT_PROXY_ENDPOINT_PROD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          systemPrompt,
          prompt: request.prompt,
          instruction: request.instruction,
          temperature: 0.7,
          maxTokens: 800
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message;
        
        console.error('GPT API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url
        });
        
        if (response.status === 401) {
          throw new Error('🔐 Unauthorized: Backend API key invalid or missing.');
        } else if (response.status === 403) {
          throw new Error('🚫 Access denied by backend.');
        } else if (response.status === 429) {
          throw new Error('⏰ Rate limit exceeded. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error('🔧 Server error: Please try again shortly.');
        } else if (response.status === 400) {
          throw new Error(`📝 Bad request: ${errorMessage || 'Invalid prompt or instruction format.'}`);
        } else if (response.status === 404) {
          throw new Error('🔧 Service unavailable: The AI modification service is not currently deployed. Please contact support.');
        }
        throw new Error(`❌ Request failed (${response.status}): ${errorMessage || response.statusText || 'Please try again.'}`);
      }

      const data = await response.json();
      
      if (!data?.content) {
        throw new Error('📭 Empty response: The AI didn\'t generate a response. Please try again with a different instruction.');
      }
      
      // Try to parse as JSON to extract the prompt
      let result: string;
      try {
        const parsed = JSON.parse(data.content);
        if (parsed.prompt) {
          result = String(parsed.prompt).trim();
        } else {
          result = String(data.content).trim();
        }
      } catch (e) {
        // If not JSON or no prompt field, return as-is
        result = String(data.content).trim();
      }
      
      return result;
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
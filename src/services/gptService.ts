import { GPTModifyRequest } from '@/types';

// Backend proxy endpoints (server-side holds the OpenAI API key)
const GPT_PROXY_ENDPOINT_PROD = 'https://veo-prompt-assistant.netlify.app/.netlify/functions/gpt';
const GPT_PROXY_ENDPOINT_DEV = 'http://localhost:8888/.netlify/functions/gpt';

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

  private generateSystemPrompt(_knowledgeBase?: any): string {
    return `You are an expert Veo 3 video prompt generator. Your task is to create detailed, effective prompts for Google's Veo 3 video generation model based on user descriptions or ideas.

IMPORTANT: Always output your response as valid JSON with the following structure:
{
  "prompt": "the complete Veo 3 prompt",
  "visual_elements": {
    "subject": "description of who/what is in the scene",
    "context": "where the scene takes place",
    "action": "what is happening",
    "style": "visual aesthetic (e.g., cinematic, animated, stop-motion)",
    "camera_motion": "how the camera moves",
    "composition": "how the shot is framed",
    "ambiance": "mood and lighting"
  },
  "audio_elements": {
    "dialogue": "what characters say (if any)",
    "ambient_sound": "background noise",
    "sound_effects": "specific sounds",
    "music": "musical elements (if any)"
  },
  "technical_notes": {
    "subtitles": "whether to include '(no subtitles)' directive",
    "pronunciation_hints": "phonetic spellings if needed",
    "character_consistency": "detailed character descriptions for consistency"
  }
}

PROMPT CONSTRUCTION GUIDELINES:
1. VISUAL ELEMENTS - Include all relevant details:
   - Subject: Be specific about appearance, clothing, age, expressions
   - Context: Describe the location in detail (indoor/outdoor, specific place)
   - Action: Clear description of movement and behavior
   - Style: Choose appropriate visual style (default is professional live-action)
   - Camera motion: Use cinematography terms (dolly, zoom, pan, tracking, aerial, eye-level, etc.)
   - Composition: Specify framing (wide shot, close-up, medium shot)
   - Ambiance: Describe lighting, mood, color tones

2. AUDIO ELEMENTS - Be explicit about all sounds:
   - Dialogue: Use format "Character says: [exact words]" or describe what they talk about
   - Keep dialogue under 8 seconds worth of speech
   - Ambient sound: Specify background noise appropriate to the scene
   - Sound effects: List any specific sounds needed
   - Music: Describe genre, mood, and style if music is needed

3. SPECIAL CONSIDERATIONS:
   - For dialogue, use colon format: "Person says: words" (not quotes)
   - Add "(no subtitles)" to prevent unwanted text overlays
   - Use phonetic spelling for proper names or unusual pronunciations
   - For selfie-style videos, start with "A selfie video of..." and mention visible arm
   - For character consistency across scenes, repeat exact character descriptions
   - Specify who speaks in multi-character scenes to avoid confusion

4. PROMPT LENGTH:
   - Create detailed prompts (100-200 words typically)
   - More detail = better control over output
   - Include negative instructions when needed (e.g., "no subtitles", "no laugh track")

5. STYLE VARIATIONS:
   - Default: Professional live-action video
   - Available styles: animated, stop-motion, claymation, hand-drawn, watercolor, cinematic, documentary, found footage, etc.
   - Style affects both visuals and character movement

Remember:
- Veo 3 produces consistent outputs for identical prompts
- Change prompts significantly for variety
- Be specific about what you want to avoid hallucinations
- Layer multiple elements for rich, compelling videos`;
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

      // If production endpoint fails due to network (e.g., offline or not deployed), try local dev server
      if (!response.ok) {
        try {
          response = await fetch(GPT_PROXY_ENDPOINT_DEV, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4o',
              systemPrompt,
              prompt: request.prompt,
              instruction: request.instruction,
              temperature: 0.7,
              maxTokens: 800
            })
          });
        } catch (_devErr) {
          // swallow to fall through to unified error handling below
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message;
        if (response.status === 401) {
          throw new Error('🔐 Unauthorized: Backend API key invalid or missing.');
        } else if (response.status === 403) {
          throw new Error('🚫 Access denied by backend.');
        } else if (response.status === 429) {
          throw new Error('⏰ Rate limit exceeded. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error('🔧 Server error: Please try again shortly.');
        }
        throw new Error(`❌ Request error: ${errorMessage || 'Please try again.'}`);
      }

      const data = await response.json();
      
      if (!data?.content) {
        throw new Error('📭 Empty response: The AI didn\'t generate a response. Please try again with a different instruction.');
      }
      
      // Try to parse as JSON to extract the prompt
      try {
        const parsed = JSON.parse(data.content);
        if (parsed.prompt) {
          return String(parsed.prompt).trim();
        }
      } catch (e) {
        // If not JSON or no prompt field, return as-is
      }
      
      return String(data.content).trim();
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
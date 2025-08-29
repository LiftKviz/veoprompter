import { paymentService } from './paymentService';
import { authService } from './authService';

// Backend proxy endpoint for Google AI image generation
const IMAGE_PROXY_ENDPOINT_PROD = 'https://veoprompter.netlify.app/.netlify/functions/google-ai-image';

interface ImageGenerationRequest {
  prompt: string;
  userId: string;
}

interface ImageGenerationResponse {
  success: boolean;
  imageUrl: string;
  prompt: string;
  usage?: {
    remaining: number | null;
  };
}

interface UsageData {
  count: number;
  lastReset: number; // timestamp
}

export class ImageGenerationService {
  private static instance: ImageGenerationService;

  private constructor() {}

  static getInstance(): ImageGenerationService {
    if (!ImageGenerationService.instance) {
      ImageGenerationService.instance = new ImageGenerationService();
    }
    return ImageGenerationService.instance;
  }

  /**
   * Get current monthly usage for image generation
   */
  async getMonthlyUsage(userId: string): Promise<UsageData> {
    try {
      const key = `imageUsage_${userId}`;
      const result = await chrome.storage.local.get([key]);
      const usage = result[key] || { count: 0, lastReset: 0 };

      // Check if we need to reset monthly count
      const now = Date.now();
      const currentMonth = new Date(now).getMonth();
      const currentYear = new Date(now).getFullYear();
      const lastResetDate = new Date(usage.lastReset);
      const lastResetMonth = lastResetDate.getMonth();
      const lastResetYear = lastResetDate.getFullYear();

      // Reset if it's a new month
      if (currentMonth !== lastResetMonth || currentYear !== lastResetYear) {
        const resetUsage = { count: 0, lastReset: now };
        await chrome.storage.local.set({ [key]: resetUsage });
        return resetUsage;
      }

      return usage;
    } catch (error) {
      console.error('Failed to get monthly usage:', error);
      return { count: 0, lastReset: Date.now() };
    }
  }

  /**
   * Increment monthly usage count
   */
  private async incrementUsage(userId: string): Promise<void> {
    try {
      const key = `imageUsage_${userId}`;
      const usage = await this.getMonthlyUsage(userId);
      usage.count += 1;
      await chrome.storage.local.set({ [key]: usage });
    } catch (error) {
      console.error('Failed to increment usage:', error);
    }
  }

  /**
   * Check if user can generate images (premium + under rate limit)
   */
  async canGenerateImage(userId: string): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
    try {
      // Check premium status using auth service (respects admin access)
      const userState = authService.getUserState();
      const isPremium = userState.tier === 'paid';
      if (!isPremium) {
        return { allowed: false, reason: 'Premium subscription required for image generation' };
      }

      // Check monthly rate limit
      const usage = await this.getMonthlyUsage(userId);
      const remaining = 125 - usage.count;
      
      if (usage.count >= 125) {
        return { 
          allowed: false, 
          reason: 'Monthly image generation limit reached (125/month)', 
          remaining: 0 
        };
      }

      return { allowed: true, remaining };
    } catch (error) {
      console.error('Failed to check generation permissions:', error);
      return { allowed: false, reason: 'Failed to check permissions' };
    }
  }

  /**
   * Generate a first frame image from a video prompt
   */
  async generateFirstFrame(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!request.prompt?.trim()) {
      throw new Error('📝 Prompt is required for image generation');
    }

    if (!request.userId?.trim()) {
      throw new Error('🔐 User ID is required for rate limiting');
    }

    // Check permissions first
    const permission = await this.canGenerateImage(request.userId);
    if (!permission.allowed) {
      throw new Error(permission.reason || 'Image generation not allowed');
    }

    try {
      const response = await fetch(IMAGE_PROXY_ENDPOINT_PROD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message;
        
        console.error('Image Generation API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url
        });
        
        if (response.status === 401) {
          throw new Error('🔐 Unauthorized: Backend API key invalid or missing');
        } else if (response.status === 403) {
          throw new Error('🚫 Access denied by backend');
        } else if (response.status === 429) {
          throw new Error('⏰ Rate limit exceeded. Please try again later');
        } else if (response.status >= 500) {
          throw new Error('🔧 Server error: Please try again shortly');
        } else if (response.status === 400) {
          throw new Error(`📝 Bad request: ${errorMessage || 'Invalid prompt format'}`);
        }
        
        throw new Error(`❌ Request failed (${response.status}): ${errorMessage || response.statusText || 'Please try again'}`);
      }

      const data = await response.json();
      
      if (!data?.success || !data?.imageUrl) {
        throw new Error('📭 No image generated: Please try again with a different prompt');
      }

      // Update local storage with server-side remaining count if provided
      if (data.usage?.remaining !== null && data.usage?.remaining !== undefined) {
        const key = `imageUsage_${request.userId}`;
        const monthlyLimit = 125;
        const used = monthlyLimit - data.usage.remaining;
        await chrome.storage.local.set({ 
          [key]: { 
            count: used, 
            lastReset: Date.now(),
            serverTracked: true 
          } 
        });
        console.log(`Server reports ${data.usage.remaining} generations remaining`);
      } else {
        // Fallback to local tracking if server doesn't provide usage
        await this.incrementUsage(request.userId);
      }

      return data;
    } catch (error) {
      console.error('Image generation error:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('🌐 Connection failed: Please check your internet connection and try again');
      }
      
      // Re-throw custom errors as-is
      throw error;
    }
  }

  /**
   * Get remaining monthly image generations for UI display
   */
  async getRemainingGenerations(userId: string): Promise<number> {
    try {
      const usage = await this.getMonthlyUsage(userId);
      return Math.max(0, 125 - usage.count);
    } catch (error) {
      console.error('Failed to get remaining generations:', error);
      return 0;
    }
  }

  /**
   * Get server-side usage information (more secure)
   */
  async getServerUsage(userId: string): Promise<{ remaining: number; limit: number }> {
    try {
      const response = await fetch(IMAGE_PROXY_ENDPOINT_PROD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'checkUsage',
          userId: userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.usage || { remaining: 125, limit: 125 };
      }
      
      // Fallback to local storage
      const usage = await this.getMonthlyUsage(userId);
      return { remaining: Math.max(0, 125 - usage.count), limit: 125 };
    } catch (error) {
      console.error('Failed to get server usage:', error);
      const usage = await this.getMonthlyUsage(userId);
      return { remaining: Math.max(0, 125 - usage.count), limit: 125 };
    }
  }
}
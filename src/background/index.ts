import { GPTService } from '../services/gptService';

// PKCE helper functions for OAuth
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => 
    String.fromCharCode(byte)
  ).join('').replace(/[^a-zA-Z0-9]/g, '').substring(0, 43);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Store active OAuth flows
const authFlows = new Map<number, (response: any) => void>();

// Initialize ExtPay directly in background
declare const ExtPay: any;
const extpay = typeof ExtPay !== 'undefined' ? ExtPay('veo-3-prompter') : null;

// Direct GPT API call with server-side rate limiting
async function callGPTServiceDirect(request: { prompt: string; instruction: string; userEmail: string; isPremium: boolean }): Promise<string> {
  if (!request.instruction?.trim()) {
    throw new Error('📝 Modification instruction required: Please describe how you want to modify the prompt.');
  }

  const gptService = GPTService.getInstance();
  const knowledgeBase = await gptService.loadKnowledgeBase();
  const systemPrompt = gptService.generateSystemPrompt(knowledgeBase);

  try {
    let response = await fetch('https://veoprompter.netlify.app/.netlify/functions/gpt', {
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
        maxTokens: 800,
        userEmail: request.userEmail,
        isPremium: request.isPremium
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || errorData.message;
      
      if (response.status === 401) {
        throw new Error('🔐 Unauthorized: Backend API key invalid or missing.');
      }
      if (response.status === 403) {
        throw new Error('🚫 Access denied by backend.');
      }
      if (response.status === 429) {
        throw new Error(errorMessage || '⏰ Rate limit exceeded. Please try again later.');
      }
      if (response.status >= 500) {
        throw new Error('🔧 Server error: Please try again shortly.');
      }
      if (response.status === 400) {
        throw new Error(`📝 Bad request: ${errorMessage || 'Invalid prompt or instruction format.'}`);
      }
      if (response.status === 404) {
        throw new Error('🔧 Service unavailable: The AI modification service is not currently deployed. Please contact support.');
      }
      
      throw new Error(`❌ Request failed (${response.status}): ${errorMessage || response.statusText || 'Please try again.'}`);
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

// Handle opening the sidebar when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Listen for tab updates to catch OAuth redirect
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && authFlows.has(tabId)) {
    const url = changeInfo.url;
    
    // Check if this is our OAuth redirect
    if (url.includes('veoprompter.netlify.app/oauth-redirect')) {
      const sendResponse = authFlows.get(tabId)!;
      authFlows.delete(tabId);
      
      try {
        // Close the OAuth tab
        await chrome.tabs.remove(tabId);
        
        // Extract authorization code from URL
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        
        console.log('OAuth redirect detected:', url);
        console.log('Authorization code:', code ? 'received' : 'missing');
        
        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for access token using dedicated auth function
        const redirectUri = 'https://veoprompter.netlify.app/oauth-redirect';
        const exchangeResponse = await fetch('https://veoprompter.netlify.app/.netlify/functions/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: code,
            redirectUri: redirectUri
          })
        });

        console.log('Exchange response status:', exchangeResponse.status);
        
        if (!exchangeResponse.ok) {
          let errorMessage = 'Failed to exchange code for token';
          try {
            const errorText = await exchangeResponse.text();
            console.error('OAuth exchange error response:', errorText);
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorData.details || errorText;
            } catch {
              errorMessage = errorText;
            }
          } catch (e) {
            console.error('Failed to read error response:', e);
          }
          throw new Error(errorMessage);
        }

        const data = await exchangeResponse.json();
        console.log('OAuth exchange success:', data);
        
        if (!data.success) {
          console.error('OAuth data indicates failure:', data);
          throw new Error(data.error || data.details || 'OAuth exchange failed');
        }
        
        // Save user data and token to storage
        await chrome.storage.local.set({ 
          user: {
            email: data.user.email,
            name: data.user.name,
            picture: data.user.picture,
            id: data.user.id
          },
          authToken: {
            access_token: data.token.access_token,
            refresh_token: data.token.refresh_token,
            expires_at: data.token.expires_at
          }
        });
        
        sendResponse({ 
          success: true, 
          user: {
            email: data.user.email,
            name: data.user.name,
            picture: data.user.picture
          }
        });
      } catch (error) {
        console.error('OAuth flow error:', error);
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
});

// Listen for tab closure to handle cancellation
chrome.tabs.onRemoved.addListener((tabId) => {
  if (authFlows.has(tabId)) {
    const sendResponse = authFlows.get(tabId)!;
    authFlows.delete(tabId);
    sendResponse({
      success: false,
      error: 'Sign in cancelled'
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    userLibrary: {
      savedPrompts: [],
      customTags: {},
      lastUpdated: new Date().toISOString()
    }
  });

  // Start ExtPay background service
  if (extpay) {
    extpay.startBackground();
    
    // Listen for payment events
    extpay.onPaid.addListener((user: any) => {
      console.log('User paid via ExtPay:', user);
      // Broadcast payment status change to all extension pages
      chrome.runtime.sendMessage({
        type: 'PAYMENT_STATUS_CHANGED',
        user: user
      });
    });
  }

  console.log('Extension installed and ExtPay background service started');
});


chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'GET_USER_LIBRARY') {
    chrome.storage.local.get(['userLibrary'], (result) => {
      sendResponse(result.userLibrary);
    });
    return true;
  }

  if (request.type === 'GET_PAYMENT_STATUS') {
    if (extpay) {
      extpay.getUser().then((user: any) => {
        sendResponse({
          paid: user.paid || false,
          paidAt: user.paidAt ? new Date(user.paidAt) : undefined,
          installedAt: new Date(user.installedAt),
          trialStartedAt: user.trialStartedAt ? new Date(user.trialStartedAt) : undefined,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus
        });
      }).catch((error: any) => {
        console.error('Error getting payment status:', error);
        sendResponse({
          paid: false,
          installedAt: new Date()
        });
      });
    } else {
      sendResponse({
        paid: false,
        installedAt: new Date()
      });
    }
    return true;
  }

  if (request.type === 'UPDATE_USER_LIBRARY') {
    chrome.storage.local.set({ userLibrary: request.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.type === 'GOOGLE_SIGN_IN') {
    (async () => {
      try {
        // Use the netlify redirect (this will work with Web Application OAuth client)
        const redirectUri = 'https://veoprompter.netlify.app/oauth-redirect';
        
        // Build OAuth URL 
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=374428444834-b7m6bvo4uv5bo4gkib44g858g6cl2feb.apps.googleusercontent.com&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent('https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile')}&` +
          `state=${Date.now()}`;

        // Open OAuth URL in a new tab
        const tab = await chrome.tabs.create({ 
          url: authUrl,
          active: true
        });

        // Store tab ID and response callback
        authFlows.set(tab.id!, sendResponse);

      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'OAuth setup failed'
        });
      }
    })();
    return true;
  }
  
  if (request.type === 'GOOGLE_SIGN_OUT') {
    chrome.storage.local.remove(['user', 'authToken'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.type === 'IMPROVE_PROMPT') {
    (async () => {
      try {
        // Check authentication and usage limits (for floating buttons)
        const userState = await chrome.storage.local.get(['user', 'dailyUsage']);
        const user = userState.user;
        
        // Require authentication
        if (!user || !user.email) {
          sendResponse({
            success: false,
            error: '🔐 Please sign in to use AI features. Click the extension icon to sign in with Google.'
          });
          return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        let dailyUsage = userState.dailyUsage || { date: today, count: 0 };
        
        // Reset daily count if it's a new day
        if (dailyUsage.date !== today) {
          dailyUsage.date = today;
          dailyUsage.count = 0;
        }
        
        // Check premium status
        const isPremium = extpay ? (await extpay.getUser()).paid : false;
        
        // Call GPTService with server-side rate limiting (server will check limits)
        const improvedPrompt = await callGPTServiceDirect({
          prompt: request.prompt,
          instruction: 'Improve this prompt by enhancing its cinematic flow and narrative quality. Add vivid details that create atmosphere and smooth action transitions. Maintain the original concept while making it more evocative and story-driven for Veo 3.',
          userEmail: user.email,
          isPremium: isPremium
        });
        
        // Note: Usage tracking is now handled server-side for security
        // Client-side counter is updated for UI purposes only
        if (!isPremium) {
          dailyUsage.count++;
          await chrome.storage.local.set({ dailyUsage });
          
          // Broadcast usage update to all extension pages
          chrome.runtime.sendMessage({
            type: 'USAGE_UPDATED',
            dailyUsage: dailyUsage
          }).catch(() => {
            // Ignore errors if no listeners
          });
        }
        
        sendResponse({
          success: true,
          improvedPrompt: improvedPrompt
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to improve prompt'
        });
      }
    })();
    return true;
  }
  
  if (request.type === 'CHANGE_PROMPT') {
    (async () => {
      try {
        // Check authentication and usage limits (for floating buttons)
        const userState = await chrome.storage.local.get(['user', 'dailyUsage']);
        const user = userState.user;
        
        // Require authentication
        if (!user || !user.email) {
          sendResponse({
            success: false,
            error: '🔐 Please sign in to use AI features. Click the extension icon to sign in with Google.'
          });
          return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        let dailyUsage = userState.dailyUsage || { date: today, count: 0 };
        
        // Reset daily count if it's a new day
        if (dailyUsage.date !== today) {
          dailyUsage.date = today;
          dailyUsage.count = 0;
        }
        
        // Check premium status
        const isPremium = extpay ? (await extpay.getUser()).paid : false;
        
        // Call GPTService with server-side rate limiting (server will check limits)
        const changedPrompt = await callGPTServiceDirect({
          prompt: request.prompt,
          instruction: `CHANGE REQUEST: "${request.instructions}". Adapt the core concept to this new context. Don't copy inappropriate details - understand the essence and recreate it appropriately. Make the change realistic and logical for the new subject matter.`,
          userEmail: user.email,
          isPremium: isPremium
        });
        
        // Note: Usage tracking is now handled server-side for security
        // Client-side counter is updated for UI purposes only
        if (!isPremium) {
          dailyUsage.count++;
          await chrome.storage.local.set({ dailyUsage });
          
          // Broadcast usage update to all extension pages
          chrome.runtime.sendMessage({
            type: 'USAGE_UPDATED',
            dailyUsage: dailyUsage
          }).catch(() => {
            // Ignore errors if no listeners
          });
        }
        
        sendResponse({
          success: true,
          changedPrompt: changedPrompt
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to change prompt'
        });
      }
    })();
    return true;
  }
  
  return false;
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    userLibrary: {
      savedPrompts: [],
      customTags: {},
      lastUpdated: new Date().toISOString()
    }
  });
  
  // Set up side panel behavior for Veo 3 sites
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'GET_USER_LIBRARY') {
    chrome.storage.local.get(['userLibrary'], (result) => {
      sendResponse(result.userLibrary);
    });
    return true;
  }

  if (request.type === 'UPDATE_USER_LIBRARY') {
    chrome.storage.local.set({ userLibrary: request.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  // Handle Improve Prompt request
  if (request.type === 'IMPROVE_PROMPT') {
    handleImprovePrompt(request.prompt, sendResponse);
    return true;
  }
  
  // Handle Change Prompt request
  if (request.type === 'CHANGE_PROMPT') {
    handleChangePrompt(request.prompt, request.instructions, sendResponse);
    return true;
  }
  
  return false;
});

// Minimal crypto class for API key decryption
class MinimalCrypto {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12;
  }

  async generateKey() {
    const extensionId = chrome.runtime.id;
    const userAgent = navigator.userAgent;
    const keyMaterial = extensionId + userAgent + 'veo3-secure-key';
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);
    
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = encoder.encode('veo3-extension-salt-2024');
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      importedKey,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['decrypt']
    );

    return key;
  }

  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async decrypt(encryptedData) {
    try {
      if (!encryptedData || typeof encryptedData !== 'string') {
        throw new Error('Invalid encrypted data');
      }

      const key = await this.generateKey();
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
      const encryptedArray = new Uint8Array(encryptedBuffer);
      
      const iv = encryptedArray.slice(0, this.ivLength);
      const data = encryptedArray.slice(this.ivLength);
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }
}

// Helper function to get and decrypt API key
async function getDecryptedApiKey() {
  try {
    // Check both local and sync storage
    const localResult = await chrome.storage.local.get(null);
    const syncResult = await chrome.storage.sync.get(null);
    
    // Try to find API key in either storage
    const allResults = { ...localResult, ...syncResult };
    
    let apiKey = allResults.secure_gptApiKey || allResults.encryptedApiKey || allResults.apiKey || allResults.openai_api_key || allResults.gptApiKey;
    
    if (!apiKey) {
      return null;
    }
    
    // If it's already a plain API key (starts with sk-), return it
    if (apiKey.startsWith('sk-')) {
      return apiKey;
    }
    
    // Check if it's a JSON object (SecureStorage format)
    try {
      const parsed = JSON.parse(apiKey);
      if (parsed.encrypted && parsed.timestamp) {
        apiKey = parsed.encrypted;
      }
    } catch (e) {
      // Not JSON, continue with the value as-is
    }
    
    // Otherwise, decrypt it
    try {
      const crypto = new MinimalCrypto();
      const decryptedKey = await crypto.decrypt(apiKey);
      
      if (decryptedKey && decryptedKey.startsWith('sk-')) {
        return decryptedKey;
      }
      
      return null;
    } catch (decryptError) {
      console.error('Failed to decrypt API key:', decryptError);
      return null;
    }
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

// The main system prompt used throughout the extension (from enhanced-gpt-service.js)
const MAIN_SYSTEM_PROMPT = `You are an expert AI prompt engineer specializing in Google Veo 3. Transform ideas into prompts using the SSASA framework:

1) SUBJECT: Clearly identify who/what is the focus with specific details (e.g., 'grizzled detective in rumpled trench coat' not 'a man')
2) SCENE: Describe environment in detail - where and when action occurs (e.g., 'dusty attic with afternoon light through grimy window')
3) ACTION: Define what subject is doing with strong verbs, chain actions with 'this happens, then that happens'
4) STYLE: Specify visual aesthetic (e.g., '1990s VHS footage', '8-bit video game', 'claymation', 'filmed on 16mm')
5) AUDIO: Explicitly describe all sounds - dialogue, ambient sounds, SFX, and music (Veo 3's signature feature)
6) CAMERA: Specify camera movements and shots (e.g., 'dolly in', 'handheld', 'aerial view', 'close-up', 'tracking shot')

For dialogue, use format: "Character Name says (with emotional tone): 'Exact words.'" - This prevents mixing up speakers.

Include negative prompt (no subtitles, no on-screen text) unless requested. Keep modifications concise and focused on the user's instruction while maintaining Veo 3 best practices.

IMPORTANT: Always output your response in JSON format: {"prompt": "your enhanced prompt here"}`;

// Function to improve prompt - uses the extension's main system prompt
async function handleImprovePrompt(prompt, sendResponse) {
  try {
    const apiKey = await getDecryptedApiKey();
    
    if (!apiKey) {
      sendResponse({ success: false, error: 'Please add your OpenAI API key in the extension settings' });
      return;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: MAIN_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Improve this video generation prompt: "${prompt}"`
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      let errorMsg = `API error: ${response.status}`;
      if (response.status === 401) {
        errorMsg = 'Invalid API key. Please check your OpenAI API key in settings.';
      } else if (response.status === 429) {
        errorMsg = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (response.status === 400) {
        const errorData = await response.json();
        errorMsg = errorData.error?.message || 'Bad request to OpenAI API';
      }
      sendResponse({ success: false, error: errorMsg });
      return;
    }
    
    const data = await response.json();
    let improvedPrompt = data.choices[0].message.content.trim();
    
    // Clean up response
    improvedPrompt = improvedPrompt.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    if (improvedPrompt.startsWith('{"prompt"') && improvedPrompt.endsWith('"}')) {
      try {
        const parsed = JSON.parse(improvedPrompt);
        improvedPrompt = parsed.prompt || improvedPrompt;
      } catch (e) {
        // If JSON parsing fails, use as-is
      }
    }
    
    sendResponse({ success: true, improvedPrompt });
  } catch (error) {
    console.error('Error improving prompt:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Function to change prompt based on instructions
async function handleChangePrompt(prompt, instructions, sendResponse) {
  try {
    const apiKey = await getDecryptedApiKey();
    
    if (!apiKey) {
      sendResponse({ success: false, error: 'Please add your OpenAI API key in the extension settings' });
      return;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: MAIN_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Original prompt: "${prompt}"

Modification instructions: ${instructions}

Please modify the prompt according to these specific instructions.`
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      let errorMsg = `API error: ${response.status}`;
      if (response.status === 401) {
        errorMsg = 'Invalid API key. Please check your OpenAI API key in settings.';
      } else if (response.status === 429) {
        errorMsg = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (response.status === 400) {
        const errorData = await response.json();
        errorMsg = errorData.error?.message || 'Bad request to OpenAI API';
      }
      sendResponse({ success: false, error: errorMsg });
      return;
    }
    
    const data = await response.json();
    let changedPrompt = data.choices[0].message.content.trim();
    
    // Clean up response
    changedPrompt = changedPrompt.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    if (changedPrompt.startsWith('{"prompt"') && changedPrompt.endsWith('"}')) {
      try {
        const parsed = JSON.parse(changedPrompt);
        changedPrompt = parsed.prompt || changedPrompt;
      } catch (e) {
        // If JSON parsing fails, use as-is
      }
    }
    
    sendResponse({ success: true, changedPrompt });
  } catch (error) {
    console.error('Error changing prompt:', error);
    sendResponse({ success: false, error: error.message });
  }
}
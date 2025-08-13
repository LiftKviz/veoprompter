import { GPTService } from '../services/gptService';

// Initialize ExtPay directly in background
declare const ExtPay: any;
const extpay = typeof ExtPay !== 'undefined' ? ExtPay('veo-3-prompter') : null;

// Handle opening the sidebar when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
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
  
  if (request.type === 'IMPROVE_PROMPT') {
    (async () => {
      try {
        const gptService = GPTService.getInstance();
        const improvedPrompt = await gptService.modifyPrompt({
          prompt: request.prompt,
          instruction: 'Improve this prompt by enhancing its cinematic flow and narrative quality. Add vivid details that create atmosphere and smooth action transitions. Maintain the original concept while making it more evocative and story-driven for Veo 3.'
        });
        
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
        const gptService = GPTService.getInstance();
        const changedPrompt = await gptService.modifyPrompt({
          prompt: request.prompt,
          instruction: `CHANGE REQUEST: "${request.instructions}". Adapt the core concept to this new context. Don't copy inappropriate details - understand the essence and recreate it appropriately. Make the change realistic and logical for the new subject matter.`
        });
        
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
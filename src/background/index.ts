import { paymentService } from '../services/paymentService';

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

  // Initialize payment service in background
  paymentService.onPaid((user) => {
    console.log('User paid:', user);
    // Broadcast payment status change to all extension pages
    chrome.runtime.sendMessage({
      type: 'PAYMENT_STATUS_CHANGED',
      user: user
    });
  });
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
  
  return false;
});
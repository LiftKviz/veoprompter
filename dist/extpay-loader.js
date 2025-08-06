/**
 * ExtPay Loader for Veo 3 Prompt Assistant
 * This file should be loaded before other scripts that use ExtPay
 */

// ExtPay SDK will be loaded from CDN or bundled
// Extension ID for Veo 3 Prompter
const EXTPAY_EXTENSION_ID = 'veo-3-prompter';

// Initialize ExtPay when available
if (typeof ExtPay !== 'undefined') {
  window.extpay = ExtPay(EXTPAY_EXTENSION_ID);
  
  // Start background service if in background context
  if (typeof chrome !== 'undefined' && chrome.runtime && !chrome.tabs) {
    window.extpay.startBackground();
    console.log('ExtPay background service started for:', EXTPAY_EXTENSION_ID);
  }
} else {
  console.warn('ExtPay SDK not loaded. Payment features will be unavailable.');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.extpay;
}
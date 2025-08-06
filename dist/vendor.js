// Vendor dependencies for Veo 3 Prompt Assistant
// This file contains minimal vendor code needed for the extension

// Simple polyfills if needed
if (!window.structuredClone) {
  window.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Extension utilities
window.ExtensionUtils = {
  // Safe JSON parsing
  safeJSONParse: (str, fallback = null) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  },
  
  // Safe storage operations
  safeStorageGet: async (keys) => {
    try {
      return await chrome.storage.local.get(keys);
    } catch (error) {
      console.error('Storage get error:', error);
      return {};
    }
  },
  
  safeStorageSet: async (data) => {
    try {
      await chrome.storage.local.set(data);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }
};

console.log('Veo 3 Extension vendor utilities loaded');
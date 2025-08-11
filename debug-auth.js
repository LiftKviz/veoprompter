// Debug script to check auth state in Chrome extension storage

const checkAuthState = async () => {
  console.log('🔍 Checking Auth State in Chrome Extension...\n');
  
  // This script needs to be run in the Chrome extension console
  // 1. Open the extension popup
  // 2. Right-click and select "Inspect"
  // 3. Go to Console tab
  // 4. Copy and paste this code:
  
  const script = `
// Check all relevant storage keys
chrome.storage.local.get(['user', 'apiKey', 'userState'], (result) => {
  console.log('📦 Storage Contents:');
  console.log('User:', result.user);
  console.log('API Key:', result.apiKey ? 'Set (hidden)' : 'Not set');
  console.log('User State:', result.userState);
  
  // Check what authService sees
  if (window.authService || window.__authService) {
    const authService = window.authService || window.__authService;
    const state = authService.getUserState();
    console.log('\\n🔐 Auth Service State:');
    console.log('Is Signed In:', state.isSignedIn);
    console.log('Tier:', state.tier);
    console.log('Has API Key:', state.hasApiKey);
    console.log('Email:', state.email);
    
    const access = authService.getFeatureAccess();
    console.log('\\n✅ Feature Access:');
    console.log('Can Modify Prompts:', access.modifyPrompts);
    console.log('Can Create Prompts:', access.createPrompts);
    console.log('Can Create Sequences:', access.createSequences);
  } else {
    console.log('\\n⚠️ Auth service not found in window');
  }
});
  `;
  
  console.log('Copy and run this in the extension console:');
  console.log('=====================================');
  console.log(script);
  console.log('=====================================');
};

checkAuthState();
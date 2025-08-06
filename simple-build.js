const fs = require('fs');
const path = require('path');

// Simple build script that copies files and creates basic bundle

// Create dist directory
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy manifest
const manifest = fs.readFileSync('public/manifest.json', 'utf8');
fs.writeFileSync('dist/manifest.json', manifest);

// Copy icons directory
if (fs.existsSync('public/icons')) {
  if (!fs.existsSync('dist/icons')) {
    fs.mkdirSync('dist/icons');
  }
  const icons = fs.readdirSync('public/icons');
  icons.forEach(icon => {
    fs.copyFileSync(`public/icons/${icon}`, `dist/icons/${icon}`);
  });
}

// Copy prompts.txt
if (!fs.existsSync('dist/data')) {
  fs.mkdirSync('dist/data');
}
if (fs.existsSync('src/data/prompts.txt')) {
  fs.copyFileSync('src/data/prompts.txt', 'dist/data/prompts.txt');
}

// Copy popup.html
const popup = fs.readFileSync('public/popup.html', 'utf8');
fs.writeFileSync('dist/popup.html', popup);

// Create basic JavaScript files for development
const backgroundJS = `
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    userLibrary: {
      savedPrompts: [],
      customTags: {},
      lastUpdated: new Date().toISOString()
    }
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
`;

const contentJS = `
console.log('Veo 3 Prompt Assistant content script loaded');

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'INSERT_PROMPT') {
    const promptInput = document.querySelector('textarea[placeholder*="prompt"]');
    
    if (promptInput) {
      promptInput.value = request.prompt;
      promptInput.dispatchEvent(new Event('input', { bubbles: true }));
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Prompt input not found' });
    }
  }
  
  return true;
});
`;

// Create placeholder popup.js (you'll need to replace this with the React build)
const popupJS = `
// This is a placeholder - replace with proper React build
document.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h2>Veo 3 Prompt Assistant</h2><p>Build in progress...</p><p>Use webpack build when ready</p></div>';
});
`;

fs.writeFileSync('dist/background.js', backgroundJS);
fs.writeFileSync('dist/content.js', contentJS);
fs.writeFileSync('dist/popup.js', popupJS);

console.log('✅ Simple build completed!');
console.log('Files created in dist/:');
console.log('- manifest.json');
console.log('- background.js');
console.log('- content.js');
console.log('- popup.js (placeholder)');
console.log('- popup.html');
console.log('- icons/ (if exists)');
console.log('- data/prompts.txt');
console.log('');
console.log('You can now load this extension in Chrome for basic testing.');
console.log('For full React functionality, fix the webpack build.');
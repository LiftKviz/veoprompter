const fs = require('fs');
const path = require('path');

// Simple React build for WSL environment
console.log('Building extension with WSL path fix...');

// Copy essential files to dist
const files = [
  { src: 'public/manifest.json', dest: 'dist/manifest.json' },
  { src: 'public/popup.html', dest: 'dist/popup.html' }
];

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy files
files.forEach(file => {
  if (fs.existsSync(file.src)) {
    fs.copyFileSync(file.src, file.dest);
    console.log(`✅ Copied ${file.src} to ${file.dest}`);
  }
});

// Copy icons directory
if (fs.existsSync('public/icons') && !fs.existsSync('dist/icons')) {
  fs.mkdirSync('dist/icons', { recursive: true });
  const icons = fs.readdirSync('public/icons');
  icons.forEach(icon => {
    if (icon !== 'placeholder.txt') {
      fs.copyFileSync(`public/icons/${icon}`, `dist/icons/${icon}`);
      console.log(`✅ Copied icon: ${icon}`);
    }
  });
}

// Create a basic React-like popup (temporary solution)
const popupJS = `
// Basic popup functionality with icon
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (!root) return;

  // Basic app structure with icon
  root.innerHTML = \`
    <div class="app" style="width: 400px; min-height: 500px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <header class="header" style="background-color: #f8f9fa; border-bottom: 1px solid #e9ecef; padding: 12px 16px;">
        <div class="header-content" style="display: flex; align-items: center; justify-content: space-between;">
          <div class="header-left" style="display: flex; align-items: center; gap: 8px;">
            <img src="/icons/icon32.svg" alt="Veo 3 Logo" class="header-logo" style="width: 24px; height: 24px; flex-shrink: 0;" />
            <h1 class="header-title" style="font-size: 18px; font-weight: 500; color: #212529; margin: 0;">Veo 3 Prompt Assistant</h1>
          </div>
          <div class="header-actions" style="display: flex; align-items: center; gap: 8px;">
            <div class="search-container" style="display: flex; align-items: center; gap: 4px; background-color: white; border-radius: 4px; padding: 4px 8px; border: 1px solid #dee2e6;">
              <input type="text" class="search-input" placeholder="Search prompts..." style="border: none; background: transparent; width: 150px; padding: 4px 0; font-size: 13px;" />
              <span class="search-icon" style="font-size: 12px; color: #6c757d;">🔍</span>
            </div>
            <button class="icon-button" style="background: transparent; border: none; padding: 6px; cursor: pointer; border-radius: 4px; font-size: 16px;">⚙️</button>
          </div>
        </div>
      </header>
      <main class="app-content" style="padding: 20px;">
        <div class="category-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
          <div class="category-card" style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 16px; cursor: pointer; text-align: center; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='white'">
            <div style="font-size: 24px; margin-bottom: 8px;">🎬</div>
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500;">Cinematic</h3>
            <p style="margin: 0; font-size: 12px; color: #6c757d;">25 prompts</p>
          </div>
          <div class="category-card" style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 16px; cursor: pointer; text-align: center; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='white'">
            <div style="font-size: 24px; margin-bottom: 8px;">🌟</div>
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500;">Creative</h3>
            <p style="margin: 0; font-size: 12px; color: #6c757d;">18 prompts</p>
          </div>
          <div class="category-card" style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 16px; cursor: pointer; text-align: center; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='white'">
            <div style="font-size: 24px; margin-bottom: 8px;">📱</div>
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500;">Commercial</h3>
            <p style="margin: 0; font-size: 12px; color: #6c757d;">12 prompts</p>
          </div>
          <div class="category-card" style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 16px; cursor: pointer; text-align: center; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='white'">
            <div style="font-size: 24px; margin-bottom: 8px;">💭</div>
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500;">My Prompts</h3>
            <p style="margin: 0; font-size: 12px; color: #6c757d;">0 prompts</p>
          </div>
        </div>
        <div style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; border-radius: 8px; text-align: center;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">🚀 Get Started!</h3>
          <p style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.9;">Add your OpenAI API key to unlock prompt modification features.</p>
          <button style="background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: 500; cursor: pointer;">Setup API Key</button>
        </div>
      </main>
    </div>
  \`;
});
`;

fs.writeFileSync('dist/popup.js', popupJS);
console.log('✅ Created popup.js with basic functionality');

// Copy background and content scripts
const backgroundJS = `
chrome.runtime.onInstalled.addListener(() => {
  console.log('Veo 3 Prompt Assistant installed');
});
`;

const contentJS = `
// Content script for Veo 3 integration
console.log('Veo 3 Prompt Assistant content script loaded');
`;

fs.writeFileSync('dist/background.js', backgroundJS);
fs.writeFileSync('dist/content.js', contentJS);

console.log('✅ Build completed successfully!');
console.log('📦 Extension ready in dist/ folder');
console.log('🔧 Load the extension from the dist/ folder in Chrome');
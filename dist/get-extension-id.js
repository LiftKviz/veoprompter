// Extension ID Helper - Run this in the extension popup console

(function() {
  const extensionId = chrome.runtime.id;
  const manifest = chrome.runtime.getManifest();
  
  console.log('='.repeat(50));
  console.log('🆔 EXTENSION ID:', extensionId);
  console.log('📝 Copy this for Google Cloud Console OAuth setup');
  console.log('='.repeat(50));
  
  console.log('📋 Current OAuth config:');
  console.log(manifest.oauth2);
  
  console.log('='.repeat(50));
  console.log('🔗 Next steps:');
  console.log('1. Copy Extension ID:', extensionId);
  console.log('2. Go to: https://console.cloud.google.com/');
  console.log('3. Create OAuth client with this Extension ID');
  console.log('4. Update manifest.json with the Client ID');
  console.log('='.repeat(50));
  
  // Try to copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(extensionId).then(() => {
      console.log('✅ Extension ID copied to clipboard!');
    }).catch(() => {
      console.log('❌ Could not copy to clipboard');
    });
  }
  
  // Create visual notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: #4285f4;
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 999999;
    max-width: 300px;
    line-height: 1.4;
  `;
  notification.innerHTML = `
    <strong>🆔 Extension ID:</strong><br>
    <code style="background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 3px;">${extensionId}</code><br><br>
    <strong>📋 Copied to clipboard!</strong><br>
    Use this in Google Cloud Console
  `;
  
  document.body.appendChild(notification);
  
  // Remove notification after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
})();
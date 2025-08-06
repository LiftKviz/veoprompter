// Show Extension ID directly in the popup UI

(function() {
  // Wait for popup to load
  setTimeout(() => {
    const extensionId = chrome.runtime.id;
    
    // Create ID display element
    const idDisplay = document.createElement('div');
    idDisplay.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      right: 10px;
      background: #f0f8ff;
      border: 2px solid #4285f4;
      border-radius: 6px;
      padding: 10px;
      font-family: monospace;
      font-size: 11px;
      z-index: 999999;
      text-align: center;
    `;
    
    idDisplay.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">🆔 Extension ID:</div>
      <div style="background: white; padding: 5px; border-radius: 3px; margin-bottom: 8px; word-break: break-all;">
        ${extensionId}
      </div>
      <button id="copy-extension-id" style="
        background: #4285f4;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
      ">📋 Copy ID</button>
      <button id="hide-extension-id" style="
        background: #ccc;
        color: black;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        margin-left: 5px;
      ">✕ Hide</button>
    `;
    
    // Add to popup
    document.body.appendChild(idDisplay);
    
    // Copy button functionality
    document.getElementById('copy-extension-id').onclick = () => {
      navigator.clipboard.writeText(extensionId).then(() => {
        document.getElementById('copy-extension-id').innerHTML = '✅ Copied!';
        setTimeout(() => {
          document.getElementById('copy-extension-id').innerHTML = '📋 Copy ID';
        }, 2000);
      });
    };
    
    // Hide button functionality
    document.getElementById('hide-extension-id').onclick = () => {
      idDisplay.remove();
    };
    
  }, 500);
})();
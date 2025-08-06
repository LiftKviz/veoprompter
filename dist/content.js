console.log('Veo 3 Prompt Assistant content script loaded');

// Input validation function
function sanitizePrompt(prompt) {
  if (typeof prompt !== 'string') {
    return '';
  }
  
  // Remove any HTML tags and limit length for security
  const sanitized = prompt
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 5000); // Limit length
    
  return sanitized.trim();
}

// Style for buttons and modals
const styles = `
  .veo-assistant-button {
    position: absolute;
    bottom: 8px;
    padding: 6px 10px;
    border-radius: 20px;
    border: none;
    color: white;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    z-index: 9999;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .veo-assistant-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .veo-assistant-button:active {
    transform: translateY(0);
  }
  
  .veo-assistant-button.improve {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    left: 10px;
  }
  
  .veo-assistant-button.change {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    left: 140px;
  }
  
  .veo-assistant-button.loading {
    opacity: 0.7;
    pointer-events: none;
  }
  
  .veo-assistant-button.loading::after {
    content: '...';
    animation: dots 1.5s infinite;
  }
  
  @keyframes dots {
    0%, 20% { content: '.'; }
    40% { content: '..'; }
    60%, 100% { content: '...'; }
  }
  
  .veo-assistant-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #1a1a1a;
    border-radius: 12px;
    padding: 24px;
    z-index: 10000;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    max-width: 500px;
    width: 90%;
  }
  
  .veo-assistant-modal h3 {
    color: #ffffff;
    margin: 0 0 16px 0;
    font-size: 18px;
  }
  
  .veo-assistant-modal textarea {
    width: 100%;
    min-height: 120px;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    color: #ffffff;
    padding: 12px;
    font-size: 14px;
    resize: vertical;
    box-sizing: border-box;
  }
  
  .veo-assistant-modal textarea:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .veo-assistant-modal-buttons {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    justify-content: flex-end;
  }
  
  .veo-assistant-modal button {
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .veo-assistant-modal button.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .veo-assistant-modal button.secondary {
    background: #3a3a3a;
    color: #aaa;
  }
  
  .veo-assistant-modal button:hover {
    transform: translateY(-1px);
  }
  
  .veo-assistant-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
  }
  
  .veo-assistant-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: #2a2a2a;
    color: white;
    border-radius: 8px;
    z-index: 10001;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .veo-assistant-notification.success {
    background: #16a34a;
  }
  
  .veo-assistant-notification.error {
    background: #dc2626;
  }
  
  @keyframes slideIn {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

// Inject styles
function injectStyles() {
  if (!document.getElementById('veo-assistant-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'veo-assistant-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `veo-assistant-notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Create modal for user input
function createModal(title, placeholder, onSubmit) {
  const overlay = document.createElement('div');
  overlay.className = 'veo-assistant-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'veo-assistant-modal';
  
  modal.innerHTML = `
    <h3>${title}</h3>
    <textarea placeholder="${placeholder}"></textarea>
    <div class="veo-assistant-modal-buttons">
      <button class="secondary">Cancel</button>
      <button class="primary">Submit</button>
    </div>
  `;
  
  const textarea = modal.querySelector('textarea');
  const cancelBtn = modal.querySelector('.secondary');
  const submitBtn = modal.querySelector('.primary');
  
  cancelBtn.onclick = () => {
    overlay.remove();
    modal.remove();
  };
  
  submitBtn.onclick = () => {
    const value = textarea.value.trim();
    if (value) {
      onSubmit(value);
      overlay.remove();
      modal.remove();
    }
  };
  
  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  
  // Focus textarea
  setTimeout(() => textarea.focus(), 100);
}

// Find and inject buttons into textarea containers
function injectButtons() {
  console.log('🔍 Veo Assistant: Looking for textareas...');
  
  // Log all textareas on the page for debugging
  const allTextareas = document.querySelectorAll('textarea');
  console.log(`📝 Found ${allTextareas.length} textarea(s) on page`);
  
  allTextareas.forEach((ta, index) => {
    console.log(`Textarea ${index}:`, {
      placeholder: ta.placeholder,
      ariaLabel: ta.getAttribute('aria-label'),
      className: ta.className,
      id: ta.id,
      value: ta.value?.substring(0, 50) + '...'
    });
  });
  
  // Try multiple selectors to find the prompt textarea
  const selectors = [
    '#PINHOLE_TEXT_AREA_ELEMENT_ID',  // Flow's specific textarea ID
    'textarea[placeholder*="Generate a video"]',
    'textarea[placeholder*="video with text"]',
    'textarea.ldIWJU',  // The class name from Flow
    'textarea[placeholder*="prompt"]',
    'textarea[placeholder*="Prompt"]',
    'textarea[placeholder*="describe"]',
    'textarea[placeholder*="Describe"]',
    'textarea[placeholder*="Write"]',
    'textarea[placeholder*="write"]',
    'textarea[placeholder*="Enter"]',
    'textarea[placeholder*="enter"]',
    'textarea[aria-label*="prompt"]',
    'textarea[aria-label*="Prompt"]',
    '.prompt-textarea',
    '#prompt-input',
    'textarea'
  ];
  
  let textarea = null;
  for (const selector of selectors) {
    const found = document.querySelector(selector);
    if (found && !found.dataset.veoAssistantProcessed) {
      textarea = found;
      console.log(`✅ Found textarea with selector: ${selector}`);
      break;
    }
  }
  
  if (!textarea) {
    console.log('❌ No suitable textarea found for button injection');
    return;
  }
  
  // Mark as processed
  textarea.dataset.veoAssistantProcessed = 'true';
  
  // For Flow, we need to find the right container (go up a few levels)
  let container = textarea.parentElement;
  
  // Try to find a better container if the immediate parent is too small
  if (container && container.parentElement) {
    // Go up one more level for Flow's structure
    const grandParent = container.parentElement;
    if (grandParent.offsetHeight > 50) {
      container = grandParent;
    }
  }
  
  if (!container) {
    console.log('❌ No suitable container found for buttons');
    return;
  }
  
  console.log('📦 Using container:', container.className || container.tagName);
  
  // Make container relative positioned for absolute buttons
  const computedStyle = window.getComputedStyle(container);
  if (computedStyle.position === 'static') {
    container.style.position = 'relative';
  }
  
  // Create Improve button
  const improveBtn = document.createElement('button');
  improveBtn.className = 'veo-assistant-button improve';
  improveBtn.textContent = '✨ Improve Prompt';
  improveBtn.onclick = async () => {
    const currentPrompt = textarea.value.trim();
    if (!currentPrompt) {
      showNotification('Please enter a prompt first', 'error');
      return;
    }
    
    improveBtn.classList.add('loading');
    improveBtn.textContent = 'Improving';
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'IMPROVE_PROMPT',
        prompt: currentPrompt
      });
      
      if (response.success) {
        textarea.value = response.improvedPrompt;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        showNotification('Prompt improved successfully!', 'success');
      } else {
        showNotification(response.error || 'Failed to improve prompt', 'error');
      }
    } catch (error) {
      console.error('Error improving prompt:', error);
      showNotification('Failed to improve prompt', 'error');
    } finally {
      improveBtn.classList.remove('loading');
      improveBtn.textContent = '✨ Improve Prompt';
    }
  };
  
  // Create Change button
  const changeBtn = document.createElement('button');
  changeBtn.className = 'veo-assistant-button change';
  changeBtn.textContent = '🔄 Change Prompt';
  changeBtn.onclick = () => {
    const currentPrompt = textarea.value.trim();
    if (!currentPrompt) {
      showNotification('Please enter a prompt first', 'error');
      return;
    }
    
    createModal(
      'How would you like to change the prompt?',
      'e.g., "Make it more cinematic", "Add more detail about lighting", "Change to nighttime scene"',
      async (instructions) => {
        changeBtn.classList.add('loading');
        changeBtn.textContent = 'Changing';
        
        try {
          const response = await chrome.runtime.sendMessage({
            type: 'CHANGE_PROMPT',
            prompt: currentPrompt,
            instructions: instructions
          });
          
          if (response.success) {
            textarea.value = response.changedPrompt;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            showNotification('Prompt changed successfully!', 'success');
          } else {
            showNotification(response.error || 'Failed to change prompt', 'error');
          }
        } catch (error) {
          console.error('Error changing prompt:', error);
          showNotification('Failed to change prompt', 'error');
        } finally {
          changeBtn.classList.remove('loading');
          changeBtn.textContent = '🔄 Change Prompt';
        }
      }
    );
  };
  
  // Append buttons to container
  container.appendChild(improveBtn);
  container.appendChild(changeBtn);
  
  console.log('Veo Assistant buttons injected successfully');
}

// Observer to detect dynamically loaded textareas
function observeForTextareas() {
  const observer = new MutationObserver((mutations) => {
    // Check if any new nodes might contain textareas
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Small delay to let the DOM settle
        setTimeout(() => {
          injectButtons();
        }, 500);
        break;
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize
function initialize() {
  console.log('🚀 Initializing Veo Assistant content script on:', window.location.href);
  injectStyles();
  
  // Try multiple times with increasing delays
  const attempts = [500, 1000, 2000, 3000, 5000, 7000, 10000];
  attempts.forEach(delay => {
    setTimeout(() => {
      console.log(`⏱️ Attempt at ${delay}ms`);
      injectButtons();
    }, delay);
  });
  
  // Set up observer for dynamic content
  observeForTextareas();
  
  // Also try again after page fully loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOM Content Loaded');
      setTimeout(injectButtons, 1500);
    });
  }
  
  // And one more time after everything settles
  window.addEventListener('load', () => {
    console.log('🌐 Window fully loaded');
    setTimeout(injectButtons, 2000);
  });
  
  // Also listen for focus events on textareas
  document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'TEXTAREA' && !e.target.dataset.veoAssistantProcessed) {
      console.log('🎯 Textarea focused, attempting injection');
      setTimeout(() => injectButtons(), 100);
    }
  });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'INSERT_PROMPT') {
    // Validate the request
    if (!request.prompt || typeof request.prompt !== 'string') {
      sendResponse({ success: false, error: 'Invalid prompt data' });
      return true;
    }
    
    // Sanitize the prompt
    const sanitizedPrompt = sanitizePrompt(request.prompt);
    
    if (!sanitizedPrompt) {
      sendResponse({ success: false, error: 'Empty or invalid prompt after sanitization' });
      return true;
    }
    
    // Try multiple selectors
    const selectors = [
      'textarea[placeholder*="prompt"]',
      'textarea[placeholder*="Prompt"]',
      'textarea[placeholder*="describe"]',
      'textarea[placeholder*="Describe"]',
      'textarea[aria-label*="prompt"]',
      'textarea[aria-label*="Prompt"]',
      '.prompt-textarea',
      '#prompt-input',
      'textarea'
    ];
    
    let promptInput = null;
    for (const selector of selectors) {
      promptInput = document.querySelector(selector);
      if (promptInput) break;
    }
    
    if (promptInput) {
      // Set the sanitized value
      promptInput.value = sanitizedPrompt;
      promptInput.dispatchEvent(new Event('input', { bubbles: true }));
      promptInput.dispatchEvent(new Event('change', { bubbles: true }));
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Prompt input not found' });
    }
  }
  
  return true;
});

// Start the script
initialize();
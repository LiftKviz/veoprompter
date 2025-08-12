console.log('Veo 3 Prompt Assistant content script loaded');

// Store references to avoid duplicate buttons
let injectedButtons: HTMLElement[] = [];
let modalElement: HTMLElement | null = null;

// Enhanced textarea detection with multiple selectors
function findTextArea(): HTMLTextAreaElement | null {
  const selectors = [
    'textarea[placeholder*="prompt"]',
    'textarea[placeholder*="Prompt"]',
    'textarea[placeholder*="Describe"]',
    'textarea[id*="prompt"]',
    'textarea[id*="PINHOLE_TEXT_AREA_ELEMENT_ID"]',
    'textarea[class*="prompt"]',
    'textarea[data-testid*="prompt"]'
  ];
  
  for (const selector of selectors) {
    const textarea = document.querySelector(selector) as HTMLTextAreaElement;
    if (textarea) {
      console.log(`Found textarea with selector: ${selector}`);
      return textarea;
    }
  }
  
  // Fallback: look for any textarea that might be the prompt input
  const textareas = document.querySelectorAll('textarea');
  for (const textarea of textareas) {
    const element = textarea as HTMLTextAreaElement;
    if (element.placeholder && element.placeholder.toLowerCase().includes('prompt') ||
        element.id && element.id.toLowerCase().includes('prompt') ||
        element.className && element.className.toLowerCase().includes('prompt')) {
      console.log('Found textarea via fallback search');
      return element;
    }
  }
  
  return null;
}

// Create and inject buttons next to textarea
function injectButtons() {
  const textarea = findTextArea();
  if (!textarea) {
    console.log('No textarea found for button injection');
    return;
  }
  
  // Remove existing buttons to avoid duplicates
  removeButtons();
  
  // Find a higher-level container that won't clip our buttons
  let buttonContainer = textarea.parentElement;
  
  // Go up the DOM tree to find a container that can hold our positioned buttons
  while (buttonContainer && buttonContainer !== document.body) {
    const computedStyle = getComputedStyle(buttonContainer);
    if (computedStyle.position === 'relative' || computedStyle.position === 'absolute') {
      break;
    }
    buttonContainer = buttonContainer.parentElement;
  }
  
  // If no suitable container found, create one around the textarea
  if (!buttonContainer || buttonContainer === document.body) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; display: inline-block; width: 100%;';
    textarea.parentNode?.insertBefore(wrapper, textarea);
    wrapper.appendChild(textarea);
    buttonContainer = wrapper;
  }
  
  // Create Improve Prompt button
  const improveBtn = createButton('I', '#00ffff', () => {
    handleImprovePrompt(textarea);
  }, 'Improve Prompt');
  
  // Create Change Prompt button
  const changeBtn = createButton('C', '#ff00ff', () => {
    handleChangePrompt(textarea);
  }, 'Change Prompt');
  
  // Position buttons on left side, outside the textarea
  const buttonGroup = document.createElement('div');
  buttonGroup.style.cssText = `
    position: fixed;
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 10000;
    pointer-events: none;
  `;
  
  // Function to update button position
  const updateButtonPosition = () => {
    const rect = textarea.getBoundingClientRect();
    buttonGroup.style.left = `${rect.left - 45}px`;
    buttonGroup.style.top = `${rect.top + 10}px`;
  };
  
  buttonGroup.appendChild(improveBtn);
  buttonGroup.appendChild(changeBtn);
  
  // Attach to document body to avoid clipping
  document.body.appendChild(buttonGroup);
  
  // Update position initially and on scroll/resize
  updateButtonPosition();
  
  // Update position when page scrolls or resizes
  const updateHandler = () => updateButtonPosition();
  window.addEventListener('scroll', updateHandler, { passive: true });
  window.addEventListener('resize', updateHandler, { passive: true });
  
  // Store handler for cleanup
  (buttonGroup as any)._updateHandler = updateHandler;
  
  injectedButtons.push(buttonGroup);
  console.log('Buttons injected successfully');
  console.log('Button container:', buttonContainer);
  console.log('Textarea:', textarea);
  console.log('Button group position:', buttonGroup.getBoundingClientRect());
}

// Create styled button
function createButton(text: string, color: string, onClick: () => void, tooltip?: string): HTMLElement {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText = `
    background: #1a1a1a;
    color: white;
    border: 2px solid ${color};
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 0 8px ${color}40;
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  `;
  
  // Create custom tooltip
  let tooltipElement: HTMLElement | null = null;
  
  if (tooltip) {
    const createTooltip = () => {
      tooltipElement = document.createElement('div');
      tooltipElement.textContent = tooltip;
      tooltipElement.style.cssText = `
        position: fixed;
        background: #333;
        color: white;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 10001;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
      `;
      document.body.appendChild(tooltipElement);
    };
    
    const showTooltip = (e: MouseEvent) => {
      if (!tooltipElement) createTooltip();
      if (tooltipElement) {
        const rect = button.getBoundingClientRect();
        tooltipElement.style.left = `${rect.right + 8}px`;
        tooltipElement.style.top = `${rect.top + rect.height / 2 - tooltipElement.offsetHeight / 2}px`;
        tooltipElement.style.opacity = '1';
      }
    };
    
    const hideTooltip = () => {
      if (tooltipElement) {
        tooltipElement.style.opacity = '0';
      }
    };
    
    button.addEventListener('mouseenter', showTooltip);
    button.addEventListener('mouseleave', hideTooltip);
  }
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px)';
    button.style.boxShadow = `0 0 12px ${color}80`;
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = `0 0 8px ${color}40`;
  });
  
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  
  return button;
}

// Remove existing buttons
function removeButtons() {
  injectedButtons.forEach(button => {
    // Remove event listeners
    if ((button as any)._updateHandler) {
      window.removeEventListener('scroll', (button as any)._updateHandler);
      window.removeEventListener('resize', (button as any)._updateHandler);
    }
    
    if (button.parentNode) {
      button.parentNode.removeChild(button);
    }
  });
  injectedButtons = [];
}

// Handle improve prompt action
function handleImprovePrompt(textarea: HTMLTextAreaElement) {
  const currentPrompt = textarea.value.trim();
  if (!currentPrompt) {
    showNotification('Please enter a prompt first', 'error');
    return;
  }
  
  showNotification('Improving prompt...', 'info');
  
  chrome.runtime.sendMessage({
    type: 'IMPROVE_PROMPT',
    prompt: currentPrompt
  }, (response) => {
    if (response && response.success) {
      textarea.value = response.improvedPrompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      showNotification('Prompt improved!', 'success');
    } else {
      showNotification(response?.error || 'Failed to improve prompt', 'error');
    }
  });
}

// Handle change prompt action
function handleChangePrompt(textarea: HTMLTextAreaElement) {
  const currentPrompt = textarea.value.trim();
  if (!currentPrompt) {
    showNotification('Please enter a prompt first', 'error');
    return;
  }
  
  showChangeModal(textarea, currentPrompt);
}

// Show change prompt modal
function showChangeModal(textarea: HTMLTextAreaElement, currentPrompt: string) {
  // Remove existing modal
  removeModal();
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: #1a1a1a;
    color: #ffffff;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  `;
  
  content.innerHTML = `
    <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #ffffff;">Change Prompt</h3>
    <p style="margin: 0 0 16px 0; color: #cccccc; font-size: 14px;">
      Describe how you'd like to modify your prompt:
    </p>
    <textarea 
      id="change-instructions" 
      placeholder="e.g., 'Make it more cinematic', 'Add a dog', 'Change to nighttime setting'"
      style="
        width: 100%;
        height: 80px;
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 6px;
        color: #ffffff;
        padding: 12px;
        font-size: 14px;
        resize: vertical;
        box-sizing: border-box;
      "
    ></textarea>
    <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
      <button id="cancel-change" style="
        background: #444;
        color: #ffffff;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
      ">Cancel</button>
      <button id="apply-change" style="
        background: linear-gradient(135deg, #ff6b35, #ff6b35dd);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
      ">Apply Change</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  modalElement = modal;
  
  // Focus on textarea
  const instructionsTextarea = content.querySelector('#change-instructions') as HTMLTextAreaElement;
  instructionsTextarea.focus();
  
  // Event listeners
  content.querySelector('#cancel-change')?.addEventListener('click', removeModal);
  
  content.querySelector('#apply-change')?.addEventListener('click', () => {
    const instructions = instructionsTextarea.value.trim();
    if (!instructions) {
      showNotification('Please provide change instructions', 'error');
      return;
    }
    
    removeModal();
    showNotification('Applying changes...', 'info');
    
    chrome.runtime.sendMessage({
      type: 'CHANGE_PROMPT',
      prompt: currentPrompt,
      instructions: instructions
    }, (response) => {
      if (response && response.success) {
        textarea.value = response.changedPrompt;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        showNotification('Prompt changed!', 'success');
      } else {
        showNotification(response?.error || 'Failed to change prompt', 'error');
      }
    });
  });
  
  // Close on ESC key
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      removeModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      removeModal();
    }
  });
}

// Remove modal
function removeModal() {
  if (modalElement && modalElement.parentNode) {
    modalElement.parentNode.removeChild(modalElement);
    modalElement = null;
  }
}

// Show notification
function showNotification(message: string, type: 'success' | 'error' | 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    z-index: 10001;
    animation: slideIn 0.3s ease;
    max-width: 300px;
    ${type === 'success' ? 'background: #16a34a;' : ''}
    ${type === 'error' ? 'background: #dc2626;' : ''}
    ${type === 'info' ? 'background: #2563eb;' : ''}
  `;
  
  // Add CSS animation
  if (!document.querySelector('#veo-assistant-animations')) {
    const style = document.createElement('style');
    style.id = 'veo-assistant-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 3000);
}

// Initialize injection with mutation observer for SPA compatibility
function initializeInjection() {
  // Initial injection attempt
  setTimeout(injectButtons, 1000);
  
  // Set up mutation observer to detect textarea changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Check if new textarea was added
            if (element.matches && element.matches('textarea')) {
              setTimeout(injectButtons, 500);
            } else if (element.querySelector && element.querySelector('textarea')) {
              setTimeout(injectButtons, 500);
            }
          }
        }
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also try injection on page load events
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(injectButtons, 1000);
    });
  } else {
    setTimeout(injectButtons, 1000);
  }
  
  // Retry injection periodically for SPA navigation
  setInterval(() => {
    if (findTextArea() && injectedButtons.length === 0) {
      injectButtons();
    }
  }, 3000);
}

// Message listener for extension communication
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'INSERT_PROMPT') {
    const promptInput = findTextArea();
    
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

// Start initialization
initializeInjection();
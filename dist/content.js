
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
    
    const promptInput = document.querySelector('textarea[placeholder*="prompt"]');
    
    if (promptInput) {
      // Set the sanitized value
      promptInput.value = sanitizedPrompt;
      promptInput.dispatchEvent(new Event('input', { bubbles: true }));
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Prompt input not found' });
    }
  }
  
  return true;
});

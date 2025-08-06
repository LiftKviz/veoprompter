console.log('Veo 3 Prompt Assistant content script loaded');

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'INSERT_PROMPT') {
    const promptInput = document.querySelector('textarea[placeholder*="prompt"]') as HTMLTextAreaElement;
    
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
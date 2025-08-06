
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

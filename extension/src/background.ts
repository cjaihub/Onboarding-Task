chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'capture_visible') {
    chrome.tabs.captureVisibleTab(
      { format: 'png' },
      (dataUrl) => {
        sendResponse({ dataUrl });
      }
    );
    return true; // Indicates asynchronous response
  }
  
  if (request.action === 'capture_full_page') {
    // The orchestration for full page capture:
    // 1. Ask content script to prepare and give us dimensions
    // 2. Loop: capture, ask content script to scroll, wait, repeat
    // 3. Stitch images
    // For now, returning stub
    chrome.tabs.captureVisibleTab(
      { format: 'png' },
      (dataUrl) => {
        sendResponse({ dataUrl }); // TODO: replace with actual scrolling logic
      }
    );
    return true;
  }
});

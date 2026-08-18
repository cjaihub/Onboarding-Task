// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
  }

  if (request.action === 'prepare_full_page') {
    // Hide scrollbars and sticky headers
    document.body.style.overflow = 'hidden';
    
    // Store original styles of fixed elements
    const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      return style.position === 'fixed' || style.position === 'sticky';
    });
    
    // We would hide them or adjust them here for full page scroll capturing
    
    sendResponse({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
  }
});

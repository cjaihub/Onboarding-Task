import React, { useState } from 'react';
import './index.css';

function App() {
  const [status, setStatus] = useState<string>('Ready to capture');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const captureVisible = () => {
    setStatus('Capturing visible area...');
    chrome.runtime.sendMessage({ action: 'capture_visible' }, (response) => {
      if (response && response.dataUrl) {
        setPreviewUrl(response.dataUrl);
        setStatus('Captured successfully!');
      } else {
        setStatus('Failed to capture.');
      }
    });
  };

  const captureFullPage = () => {
    setStatus('Capturing full page (stub)...');
    chrome.runtime.sendMessage({ action: 'capture_full_page' }, (response) => {
      if (response && response.dataUrl) {
        setPreviewUrl(response.dataUrl);
        setStatus('Full page captured!');
      } else {
        setStatus('Failed to capture.');
      }
    });
  };

  const openInUsalama = () => {
    if (!previewUrl) return;
    // In a real implementation, we would send the dataUrl to the Usalama web app via message passing or postMessage
    // or store it in chrome.storage and open the Usalama URL.
    setStatus('Opening in Usalama...');
    window.open('http://localhost:3000/feedback/new', '_blank');
  };

  return (
    <div className="extension-container">
      <header className="header">
        <h1>Usalama Capture</h1>
      </header>
      
      <main className="main-content">
        {!previewUrl ? (
          <div className="action-buttons">
            <button className="btn primary" onClick={captureVisible}>Capture Visible</button>
            <button className="btn secondary" onClick={captureFullPage}>Capture Full Page</button>
          </div>
        ) : (
          <div className="preview-container">
            <img src={previewUrl} alt="Capture preview" className="preview-image" />
            <div className="action-buttons horizontal">
              <button className="btn primary" onClick={openInUsalama}>Open in Usalama</button>
              <button className="btn outline" onClick={() => setPreviewUrl(null)}>Cancel</button>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>{status}</p>
      </footer>
    </div>
  );
}

export default App;

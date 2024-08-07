// src/init/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App.tsx';
import './assets/xterm.css';
import './assets/terminal.css';
import monaco from 'monaco-editor';

declare global {
  interface Window {
    monaco: typeof monaco;
    monacoReady: Promise<void>;
    monacoReadyResolve: () => void;
  }
}

// Ensure monacoReady is defined on the window object
if (!window.monacoReady) {
  window.monacoReady = new Promise<void>((resolve) => {
    window.monacoReadyResolve = resolve;
  });
}

// Attach monaco to the window object as early as possible
window.monaco = monaco;
console.log('window.monaco', window.monaco);
window.monacoReadyResolve();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
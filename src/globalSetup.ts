// src/globalSetup.ts
import * as monaco from 'monaco-editor';

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
window.monacoReadyResolve();
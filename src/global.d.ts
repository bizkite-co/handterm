// src/global.d.ts
import * as monaco from 'monaco-editor';

declare global {
  interface Window {
    monaco: typeof monaco;
    monacoReady: Promise<void>;
    monacoReadyResolve: () => void;
  }
}
declare global {
  interface Window {
    exposeSignals: () => void;
  }
}

export {};
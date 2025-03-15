import React, { createContext, useEffect, useRef, useContext } from 'react';
import { WebContainer } from '@webcontainer/api';

interface WebContainerContextType {
  webContainer: WebContainer | null;
}

const WebContainerContext = createContext<WebContainerContextType | null>(null);

const WebContainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const webContainerRef = useRef<WebContainer | null>(null);
  const hasBootedRef = useRef(false);

  useEffect(() => {
    console.error('useEffect: hasBootedRef.current before init:', hasBootedRef.current);

    const initWebContainer = async () => {
      console.error('initWebContainer called');
      if (hasBootedRef.current) {
        console.log('WebContainer already booted');
        return;
      }

      hasBootedRef.current = true; // Set *before* the boot attempt

      try {
        const wc = await WebContainer.boot();
        webContainerRef.current = wc;
        console.log('WebContainer booted successfully');
      } catch (err) {
        console.error('Failed to initialize WebContainer:', err);
      }
    };

    initWebContainer();

    // No cleanup needed for this simplified version
  }, []);

  const contextValue: WebContainerContextType = {
    webContainer: webContainerRef.current, // Provide the ref directly
  };

  return (
    <WebContainerContext.Provider value={contextValue}>
      {children}
    </WebContainerContext.Provider>
  );
};

const useWebContainer = () => {
    const context = useContext(WebContainerContext);
    if (!context) {
        throw new Error('useWebContainer must be used within a WebContainerProvider');
    }
    return context;
}

export { WebContainerContext, WebContainerProvider, useWebContainer };
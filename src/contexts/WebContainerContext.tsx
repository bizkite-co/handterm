import React, { createContext, useEffect, useRef, useContext } from 'react';
import { WebContainer } from '@webcontainer/api';
import { parseLocation } from 'src/utils/navigationUtils';
import { ActivityType } from '@handterm/types';

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
        document.body.classList.add('webcontainer-active'); // Add class on initialization
      } catch (err) {
        console.error('Failed to initialize WebContainer:', err);
      }
    };

    initWebContainer();

    // No cleanup needed for this simplified version
  }, []);

    useEffect(() => {
    const { activityKey } = parseLocation();

    const cleanupWebContainer = async () => {
      if (webContainerRef.current) {
        await webContainerRef.current.teardown();
        console.log('WebContainer teardown called.');
        document.body.classList.remove('webcontainer-active'); // Remove class on teardown
        webContainerRef.current = null;
        hasBootedRef.current = false;
      }
    };

    if (activityKey === ActivityType.WEBCONTAINER && !hasBootedRef.current) {
      // Initialize WebContainer if not already booted
      hasBootedRef.current = true; // Prevent multiple initializations
      WebContainer.boot().then(wc => {
        webContainerRef.current = wc;
        console.log('WebContainer booted successfully in WEBCONTAINER mode');
        document.body.classList.add('webcontainer-active'); // Add class on initialization
      }).catch(err => {
        console.error('Failed to initialize WebContainer in WEBCONTAINER mode:', err);
      });
    } else if (activityKey === ActivityType.NORMAL) {
      cleanupWebContainer();
    }
  }, [webContainerRef, hasBootedRef]);

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
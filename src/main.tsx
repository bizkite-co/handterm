import { StrictMode } from 'react';
import './commands';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { App } from './App'
import { exposeSignals } from './e2e/helpers/exposeSignals';
import { QueryProvider } from './providers/QueryProvider';
import { createLogger, LogLevel } from './utils/Logger';
import { initializeActivityState } from './utils/navigationUtils';

if (typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}

// Define 'global' if it's undefined (for browser environments)
if (typeof global === 'undefined') {
  window.global = window;
}

const logger: ReturnType<typeof createLogger> = createLogger({
  prefix: 'main',
  level: LogLevel.ERROR
});

// Expose signals for e2e testing in development/test environments
if (import.meta.env.DEV !== undefined || import.meta.env.TEST !== undefined || process.env.PLAYWRIGHT_TEST === '1') {
  exposeSignals();

  try {
    void (async () => {
      const ReactDOM = await import('react-dom/client').catch((err: unknown) => {
        logger.error('Failed to load react-dom/client:', err);
        throw err; // Re-throw the error to be caught by the outer catch block
      });
      const router = (
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </BrowserRouter>
      )

      // Initialize activity state from URL parameters
      initializeActivityState();

      ReactDOM
        .createRoot(document.getElementById('root') as HTMLElement)
        .render(
          <StrictMode>
            <QueryProvider>
              {router}
            </QueryProvider>
          </StrictMode>
        );
    })();
  } catch (error) {
    logger.error('Error during initialization:', error);
  }
}

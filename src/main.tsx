import './commands';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { App } from './App'
import { exposeSignals } from './e2e/helpers/exposeSignals';
import { QueryProvider } from './providers/QueryProvider';
import { createLogger, LogLevel } from './utils/Logger';
import { initializeActivityState } from './utils/navigationUtils';
import { WebContainer } from '@webcontainer/api';

if (typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}

if (typeof global === 'undefined') {
  window.global = window;
}

const logger: ReturnType<typeof createLogger> = createLogger({
  prefix: 'main',
  level: LogLevel.ERROR
});

async function initializeWebContainer() {
    logger.info('Booting WebContainer...');
    window.webcontainerInstance = await WebContainer.boot();
    logger.info('WebContainer booted successfully.');
}

if (import.meta.env.DEV !== undefined || import.meta.env.TEST !== undefined || process.env.PLAYWRIGHT_TEST === '1') {
  exposeSignals();

  try {
    void (async () => {
      const ReactDOM = await import('react-dom/client').catch((err: unknown) => {
        logger.error('Failed to load react-dom/client:', err);
        throw err;
      });
      const router = (
        <BrowserRouter future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </BrowserRouter>
      )

      initializeActivityState();
      await initializeWebContainer();

      ReactDOM
        .createRoot(document.getElementById('root') as HTMLElement)
        .render(
          
            <QueryProvider>
              {router}
            </QueryProvider>
          
        );
    })();
  } catch (error) {
    logger.error('Error during initialization:', error);
  }
}

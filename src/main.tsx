import { StrictMode } from 'react';
import './commands';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { App } from './App'
import { exposeSignals } from './e2e/helpers/exposeSignals';
import { QueryProvider } from './providers/QueryProvider';
import { createLogger, LogLevel } from './utils/Logger';

window.Buffer = Buffer;


// Define 'global' if it's undefined (for browser environments)
if (typeof global === 'undefined') {
  window.global = window;
}

const logger = createLogger({
  prefix: 'main',
  level: LogLevel.DEBUG
});

// Expose signals for e2e testing in development/test environments
if (import.meta.env.DEV !== undefined || import.meta.env.TEST !== undefined) {
  exposeSignals();
  logger.error('Failed to load react-dom/client:');

  try {
    void (async () => {
      const ReactDOM = await import('react-dom/client').catch(err => {
        logger.error('Failed to load react-dom/client:', err);
        throw err; // Re-throw the error to be caught by the outer catch block
      });
      const router = createBrowserRouter([
        {
          path: '/*',
          element: <App />,
          children: [
            { path: 'game/:phraseId', element: <App /> },
            { path: 'tutorial/:tutorialId', element: <App /> },
            { path: 'edit', element: <App /> },
          ]
        }
      ],
        {
          /* eslint-disable @typescript-eslint/naming-convention */
          future: {
            v7_fetcherPersist: true,
            v7_normalizeFormMethod: true,
            v7_partialHydration: true,
            v7_relativeSplatPath: true,
            v7_skipActionErrorRevalidation: true,
          }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      )

      ReactDOM
        .createRoot(document.getElementById('root') as HTMLElement)
        .render(
          <StrictMode>
            <QueryProvider>
              <RouterProvider
                router={router}
                /* eslint-disable @typescript-eslint/naming-convention */
                future={{ v7_startTransition: true }}
              /* eslint-enable @typescript-eslint/naming-convention */
              />
            </QueryProvider>
          </StrictMode>
        );
    })();
  } catch (err) {
    logger.error('Error during initialization:', err);
  }
}
import { Buffer } from 'buffer';
import './commands';
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App'

window.Buffer = Buffer;

// Define 'global' if it's undefined (for browser environments)
if (typeof global === 'undefined') {
  window.global = window;
}

(async () => {
  const ReactDOM = await import('react-dom/client');
  const router = createBrowserRouter([
    {
      path: '/',
      element: <App />,
      children: [
        { path: 'game', element: <App /> },
        { path: 'tutorial', element: <App /> },
        { path: 'edit', element: <App /> },
      ]
    }
  ])

  ReactDOM
    .createRoot(document.getElementById('root')!)
    .render(
      // <React.StrictMode>
        <RouterProvider router={router} />
      // </React.StrictMode>
    );
})();

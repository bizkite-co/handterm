import ReactDOM from 'react-dom/client';
import App from './App';

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    // Create a root and render the React App component
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);

    // Any other non-React initialization can still happen here
    const terminalNav = document.getElementById('terminal-nav');
    if(terminalNav) terminalNav.addEventListener('click', () => {
      rootElement.focus();
    });
  }
});
import React, { useRef, useEffect } from 'react';
import { useMonacoTerminal } from '../hooks/useMonacoTerminal'; // Adjust path as needed

interface MonacoTerminalProps {
  // Define any props needed for the component, e.g., initial content, theme
}

export const MonacoTerminal: React.FC<MonacoTerminalProps> = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalAdapter = useMonacoTerminal(terminalRef); // Pass the ref to the hook

  useEffect(() => {
    // Any additional setup or event listeners for the component
    // For example, if useMonacoTerminal doesn't handle initial focus, do it here
    terminalAdapter.focus();
  }, [terminalAdapter]);

  return (
    <div
      ref={terminalRef}
      id="monaco-terminal-container"
      style={{
        height: '100%', // Ensure it fills the parent
        width: '100%',
        // Add any specific styling for the Monaco editor container
      }}
    />
  );
};
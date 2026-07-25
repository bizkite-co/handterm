import { useRef, useState, useEffect, useCallback } from 'react';
import MonacoCore from './MonacoCore';
import { useMonacoTerminal } from '../hooks/useMonacoTerminal';
import type { IStandaloneCodeEditor } from '@handterm/types';
import { createLogger, LogLevel } from '../utils/Logger';

const logger = createLogger({
  prefix: 'MonacoTerminal',
  level: LogLevel.WARN
});

interface MonacoTerminalProps {
  onTerminalReady?: (adapter: ReturnType<typeof useMonacoTerminal>) => void;
  onEnter: (value: string) => void;
}

export default function MonacoTerminal({ onTerminalReady, onEnter }: MonacoTerminalProps) {
  const [editorInstance, setEditorInstance] = useState<IStandaloneCodeEditor | null>(null);
  // Tracks the current vim mode so useMonacoTerminal can defer keys to vim in normal mode.
  const currentModeRef = useRef<string>('insert');
  const terminalAdapter = useMonacoTerminal(editorInstance, currentModeRef);

  useEffect(() => {
    if (editorInstance && onTerminalReady) {
      logger.debug("MonacoTerminal: Editor instance ready, calling onTerminalReady.");
      onTerminalReady(terminalAdapter);
    }
    // Only run when editorInstance changes from null to something
  }, [editorInstance]);

  const handleEditorReady = (editor: IStandaloneCodeEditor) => {
    logger.debug("MonacoTerminal: handleEditorReady called, setting editor instance.");
    setEditorInstance(editor);
  };

  const handleVimModeChange = useCallback((mode: string) => {
    currentModeRef.current = mode;
  }, []);

  return (
    <MonacoCore
      value=""
      language="plaintext"
      mode="terminal"
      onEditorReady={handleEditorReady}
      onEnter={onEnter}
      onVimModeChange={handleVimModeChange}
    />
  );
}
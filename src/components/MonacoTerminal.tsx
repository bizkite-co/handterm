import { useRef, useState, useEffect, useCallback, type JSX } from 'react';
import MonacoCore from './MonacoCore';
import { useMonacoTerminal } from '../hooks/useMonacoTerminal';
import type { IStandaloneCodeEditor } from '@handterm/types';
import type { VimModeInstance } from 'monaco-vim';
import { createLogger, LogLevel } from '../utils/Logger';

const logger = createLogger({
  prefix: 'MonacoTerminal',
  level: LogLevel.WARN
});

interface MonacoTerminalProps {
  onTerminalReady?: (adapter: ReturnType<typeof useMonacoTerminal>) => void;
  onEnter: (value: string) => void;
}

export default function MonacoTerminal({ onTerminalReady, onEnter }: MonacoTerminalProps): JSX.Element {
  const [editorInstance, setEditorInstance] = useState<IStandaloneCodeEditor | null>(null);
  // Tracks the current vim mode so useMonacoTerminal can defer keys to vim in normal mode.
  const currentModeRef = useRef<string>('insert');
  // Exposes the vim instance so useMonacoTerminal can trigger mode changes (e.g. Alt+S → normal).
  const vimInstanceRef = useRef<VimModeInstance | null>(null);
  const terminalAdapter = useMonacoTerminal(editorInstance, currentModeRef, vimInstanceRef);

  // Keep latest callbacks in refs so the readiness effect only fires on
  // editorInstance transitions (null → instance), regardless of render churn.
  const onTerminalReadyRef = useRef(onTerminalReady);
  useEffect(() => {
    onTerminalReadyRef.current = onTerminalReady;
  }, [onTerminalReady]);
  const terminalAdapterRef = useRef(terminalAdapter);
  useEffect(() => {
    terminalAdapterRef.current = terminalAdapter;
  }, [terminalAdapter]);

  useEffect(() => {
    if (editorInstance && onTerminalReadyRef.current) {
      logger.debug("MonacoTerminal: Editor instance ready, calling onTerminalReady.");
      onTerminalReadyRef.current(terminalAdapterRef.current);
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
      vimModeInstanceRef={vimInstanceRef}
    />
  );
}
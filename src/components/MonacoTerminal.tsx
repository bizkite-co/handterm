import { useRef, useState, useEffect } from 'react';
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
  const terminalAdapter = useMonacoTerminal(editorInstance);

  useEffect(() => {
    if (editorInstance && onTerminalReady) {
      logger.debug("MonacoTerminal: Editor instance ready, calling onTerminalReady.");
      onTerminalReady(terminalAdapter);
    }
  }, [editorInstance, onTerminalReady, terminalAdapter]); // Keep dependencies for now, but focus on stability of terminalAdapter

  const handleEditorReady = (editor: IStandaloneCodeEditor) => {
    logger.debug("MonacoTerminal: handleEditorReady called, setting editor instance.");
    setEditorInstance(editor);
  };

  return (
    <MonacoCore
      value=""
      language="plaintext"
      mode="terminal"
      onEditorReady={handleEditorReady}
      onEnter={onEnter}
    />
  );
}
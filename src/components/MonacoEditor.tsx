import { useRef, useEffect, useState, useCallback } from 'react';
import type { ActivityType, GamePhrase } from '../types/Types';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { initVimMode } from 'monaco-vim';
import { createLogger, LogLevel } from 'src/utils/Logger';

const logger = createLogger({
  prefix: 'MonacoEditor',
  level: LogLevel.DEBUG,
});

interface TreeItem {
  path: string;
  type: 'file' | 'directory';
}

interface MonacoEditorProps {
  initialValue?: string;
  language?: string;
  height?: string;
  isTreeView?: boolean;
  treeItems?: TreeItem[];
  onFileSelect?: (file: string) => void;
  // Context values
  activity?: ActivityType;
  tutorial?: GamePhrase | null;
  commandTime?: Date;
  showVideo?: boolean;
}

function MonacoEditorComponent({
  initialValue = '',
  language = 'javascript',
  height = '80vh',
  isTreeView = false,
  treeItems = [],
  onFileSelect = () => { }
}: MonacoEditorProps): JSX.Element {
  const [value, setValue] = useState(initialValue);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const vimStatusBarRef = useRef<HTMLDivElement | null>(null);
  const vimModeRef = useRef<{ dispose: () => void } | null>(null);

  const handleFileSelection = useCallback(
    (item: TreeItem) => {
      if (item.type === 'directory') {
        logger.debug('Toggling directory:', item.path);
      } else {
        logger.info('Opening file:', item.path);
        onFileSelect(item.path);
      }
    },
    [onFileSelect]
  );

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    _monaco: Monaco
  ) => {
    editorRef.current = editor;
    if (vimStatusBarRef.current) {
      vimModeRef.current = initVimMode(editor, vimStatusBarRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (vimModeRef.current) {
        vimModeRef.current.dispose();
      }
    };
  }, []);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <div
        ref={vimStatusBarRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20px',
          backgroundColor: '#1e1e1e',
          color: '#fff',
          padding: '2px 5px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}
      />
      {isTreeView && treeItems.length > 0 && (
        <div>
          {treeItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleFileSelection(item)}
            >
              {item.path}
            </button>
          ))}
        </div>
      )}
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={value}
        onChange={(newValue) => setValue(newValue || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true
        }}
      />
    </div>
  );
}

MonacoEditorComponent.displayName = 'MonacoEditor';


export { MonacoEditorComponent as MonacoEditor };

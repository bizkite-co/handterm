import { useRef, useEffect, useImperativeHandle, useState, useCallback } from 'react';
import loader from '@monaco-editor/loader';
import type * as Monaco from 'monaco-editor';
import monacoVim from 'monaco-vim';
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
  onClose: () => void;
  height?: string;
  isTreeView?: boolean;
  treeItems?: TreeItem[];
  onFileSelect?: (file: string) => void;
}

function MonacoEditorComponent(
  {
    initialValue = '',
    language = 'javascript',
    onClose,
    height = '80vh',
    isTreeView = false,
    treeItems = [],
    onFileSelect = () => { }
  }: MonacoEditorProps
): JSX.Element {
  const [value, setValue] = useState(initialValue);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const vimModeRef = useRef<ReturnType<typeof monacoVim.initVimMode> | null>(null);
  const vimStatusBarRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(
    null,
    () => {
      if (editorRef.current === null) {
        const errorMessage = 'Editor ref is not available';
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      return editorRef.current;
    },
    [editorRef],
  );

  const handleFileSelection = useCallback(
    (item: TreeItem) => {
      if (item.type === 'directory') {
        logger.debug('Toggling directory:', item.path);
        // Toggle directory expansion logic
      } else {
        logger.info('Opening file:', item.path);
        onFileSelect(item.path);
      }
    },
    [onFileSelect],
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleEditorDidMount = (
    editor: Monaco.editor.IStandaloneCodeEditor
  ) => {
    editorRef.current = editor;
    // Initialize Vim mode
    if (vimStatusBarRef.current != null) {
      vimModeRef.current = monacoVim.initVimMode(editor, vimStatusBarRef.current);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup editor instance and Vim mode
      if (editorRef.current !== null) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
      if (vimModeRef.current !== null) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
    };
  }, []);

  const [editorContainer, setEditorContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorContainer == null) return;

    let editorInstance: Monaco.editor.IStandaloneCodeEditor | null = null;
    let vimInstance: ReturnType<typeof monacoVim.initVimMode>;

    void loader.init().then(monaco => {
      editorInstance = monaco.editor.create(editorContainer, {
        value,
        language,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
      });

      editorRef.current = editorInstance;
      handleEditorDidMount(editorInstance);

      if (vimStatusBarRef.current != null) {
        vimInstance = monacoVim.initVimMode(editorInstance, vimStatusBarRef.current);
        vimModeRef.current = vimInstance;
      }

      editorInstance.onDidChangeModelContent(() => {
        if (editorInstance != null) {
          setValue(editorInstance.getValue());
        }
      });
    }).catch(error => {
      logger.error('Failed to initialize Monaco editor:', error);
    });

    return () => {
      if (editorInstance != null) {
        editorInstance.dispose();
      }
      if (vimInstance) {
        vimInstance.dispose();
      }
    };
  }, [editorContainer, language, value]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <div ref={vimStatusBarRef} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '20px', backgroundColor: '#1e1e1e', color: '#fff', padding: '2px 5px', fontFamily: 'monospace', fontSize: '12px' }} />
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
      <div
        ref={setEditorContainer}
        style={{ height: '100%', width: '100%' }}
      />
      <button onClick={handleClose}>Close</button>
    </div>
  );
}

MonacoEditorComponent.displayName = 'MonacoEditor';

export { MonacoEditorComponent as MonacoEditor };

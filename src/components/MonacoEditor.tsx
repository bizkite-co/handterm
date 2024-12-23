import {
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';

import { type editor } from 'monaco-editor';

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
    onClose,
    height = '80vh',
    isTreeView = false,
    treeItems = [],
    onFileSelect = () => {}
  }: MonacoEditorProps
): JSX.Element {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useImperativeHandle(
    null,
    () => {
      if (editorRef.current === null) {
        throw new Error('Editor ref is not available');
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

  return (
    <div style={{ height, width: '100%' }}>
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
      <button onClick={handleClose}>Close</button>
    </div>
  );
}

MonacoEditorComponent.displayName = 'MonacoEditor';

export { MonacoEditorComponent as MonacoEditor };

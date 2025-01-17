import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback, useMemo } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { IStandaloneCodeEditor } from '../types/monaco';
import { KeyCode } from 'monaco-editor';
import type * as monaco from 'monaco-editor';
import { initVimMode } from 'monaco-vim';
import { formatTreeContent, getItemAtLine } from '../utils/treeFormatter';

interface TreeItem {
  path: string;
  type: 'file' | 'directory' | 'blob' | 'tree';
}

interface MonacoEditorProps {
  initialValue: string;
  language: string;
  height?: string;
  isTreeView: boolean;
  treeItems?: TreeItem[];
  onFileSelect?: (path: string) => void;
}

export interface MonacoEditorHandle {
  focus: () => void;
}

interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
}

const isGitHubTreeItem = (item: unknown): item is GitHubTreeItem => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'path' in item &&
    'type' in item &&
    (item.type === 'blob' || item.type === 'tree')
  );
};

const isGitHubTreeItems = (items: unknown): items is GitHubTreeItem[] => {
  return Array.isArray(items) && items.every(isGitHubTreeItem);
};

const mapGitHubToLocalTreeItem = (item: GitHubTreeItem): TreeItem => ({
  path: item.path,
  type: item.type === 'blob' ? 'file' : 'directory'
});

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  ({ initialValue, language = 'plaintext', height = '80vh', isTreeView, onFileSelect }, ref) => {
    const editorRef = useRef<IStandaloneCodeEditor | null>(null);
    const vimStatusBarRef = useRef<HTMLDivElement | null>(null);
    const vimModeRef = useRef<monaco.IDisposable | null>(null);
    const [disposables] = useState<monaco.IDisposable[]>([]);
    interface NavigationState {
      items: TreeItem[];
      path: string;
    }

    const history = useRef<NavigationState[]>([]);
    const [treeItemsState, setTreeItemsState] = useState<TreeItem[]>([]);
    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }
    }));

    const handleEditorDidMount = (
      editor: IStandaloneCodeEditor,
      _monaco: Monaco
    ) => {
      editorRef.current = editor;
      window.monacoEditor = editor;

      if (vimStatusBarRef.current) {
        vimModeRef.current = initVimMode(editor, vimStatusBarRef.current);
      }

      if (isTreeView) {
        editor.updateOptions({ readOnly: true });

        const moveDown = editor.addAction({
          id: 'moveDown',
          label: 'Move Down',
          keybindings: [KeyCode.KeyJ],
          run: () => {
            const currentLine = editor.getPosition()?.lineNumber || 1;
            const nextLine = Math.min(currentLine + 1, editor.getModel()?.getLineCount() || 1);
            editor.setPosition({ lineNumber: nextLine, column: 1 });
            editor.revealLine(nextLine);
          }
        });
        disposables.push(moveDown);

        const moveUp = editor.addAction({
          id: 'moveUp',
          label: 'Move Up',
          keybindings: [KeyCode.KeyK],
          run: () => {
            const currentLine = editor.getPosition()?.lineNumber ?? 1;
            const prevLine = Math.max(currentLine - 1, 1);
            editor.setPosition({ lineNumber: prevLine, column: 1 });
            editor.revealLine(prevLine);
          }
        });
        disposables.push(moveUp);

        const selectItem = editor.addAction({
          id: 'selectItem',
          label: 'Select Item',
          keybindings: [KeyCode.Enter],
          run: () => {
            const currentLine = editor.getPosition()?.lineNumber ?? 1;
            const item = getItemAtLine(treeItemsState, currentLine);

            if (item != null) {
              if (item.type === 'directory') {
                // Filter tree items to show only items within this directory
                // Store current state for back navigation
                const currentState = {
                  items: treeItemsState,
                  path: item.path
                };
                history.current.push(currentState);

                // Show directory contents
                const newTreeItems = treeItemsState.filter(t =>
                  t.path.startsWith(item.path + '/') &&
                  t.path.split('/').length === item.path.split('/').length + 1
                );
                const newContent = formatTreeContent(newTreeItems);
                editor.setValue(newContent);
                editor.setPosition({ lineNumber: 1, column: 1 });
              } else if (onFileSelect != null) {
                onFileSelect(item.path);
                window.selectedFilePath = item.path;
              }
            }
          }
        });
        disposables.push(selectItem);
      }
    };

    const updateTreeData = useCallback(() => {
      console.log('MonacoEditor: updateTreeData called');
      if (!isTreeView) return;

      const storedItems = localStorage.getItem('github_tree_items');
      console.log('MonacoEditor: Retrieved github_tree_items from localStorage:', storedItems);
      if (!storedItems) {
        console.log('MonacoEditor: No tree items found in localStorage');
        setTreeItemsState([]);
        return;
      }

      try {
        const parsedItems: unknown = JSON.parse(storedItems);
        if (isGitHubTreeItems(parsedItems)) {
          const mappedItems = parsedItems.map(mapGitHubToLocalTreeItem);
          setTreeItemsState(mappedItems);
          setInitialized(true);
          setError(null);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Failed to parse github_tree_items:', error.message);
          setError(error.message);
          setTreeItemsState([]);
        }
      }
    }, [isTreeView]);

    useEffect(() => {
      if (isTreeView) {
        updateTreeData();
      }
    }, [isTreeView, updateTreeData]);

    useEffect(() => {
      if (isTreeView && !initialized) {
        updateTreeData();
      }
    }, [isTreeView, initialized, updateTreeData]);

    useEffect(() => {
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'github_tree_items') {
          updateTreeData();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }, [updateTreeData]);

    const editorContent = useMemo(() => {
      if (!isTreeView) return initialValue;
      if (error) return `Error: ${error}`;
      if (!initialized) return 'Loading...';
      if (treeItemsState.length === 0) return 'No files available';

      try {
        return formatTreeContent(treeItemsState);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to format tree content';
        setError(message);
        return `Error: ${message}`;
      }
    }, [isTreeView, initialValue, error, treeItemsState, initialized]);

    useEffect(() => {
      if (editorRef.current != null) {
        editorRef.current.updateOptions({
          readOnly: isTreeView,
          lineNumbers: isTreeView ? 'off' : 'on'
        });

        const currentValue = editorRef.current.getValue();
        if (currentValue !== editorContent) {
          editorRef.current.setValue(editorContent);
          editorRef.current.setPosition({ lineNumber: 1, column: 1 });
          editorRef.current.revealLine(1);
        }
      }
    }, [editorContent, isTreeView, treeItemsState, initialized]);

    return (
      <div data-testid="monaco-editor-container" style={{ height, width: '100%', position: 'relative' }}>
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
        <Editor
          height="100%"
          width="100%"
          language={language}
          value={isTreeView ? editorContent : initialValue}
          onMount={handleEditorDidMount}
          options={{
            lineNumbers: isTreeView ? 'off' : 'on',
            readOnly: isTreeView,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            contextmenu: false,
            quickSuggestions: false,
            parameterHints: { enabled: false },
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'off',
            wordBasedSuggestions: 'off'
          }}
        />
      </div>
    );
  }
);

MonacoEditor.displayName = 'MonacoEditor';

export { MonacoEditor };

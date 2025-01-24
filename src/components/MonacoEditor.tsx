import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback, useMemo } from 'react';
import * as monaco from 'monaco-editor';
import { initVimMode } from 'monaco-vim';
import type {
  IDisposable,
  IStandaloneCodeEditor,
  KeyCode,
  KeyMod
} from '@handterm/types';

declare global {
  interface Window {
    monacoEditor?: IStandaloneCodeEditor;
    selectedFilePath?: string;
  }
}

type OnMount = (
  editor: editor.IStandaloneCodeEditor,
  monacoInstance: typeof monaco
) => void;
import { formatTreeContent, getItemAtLine } from '../utils/treeFormatter';

// Declare window extensions
declare global {
  interface Window {
    monacoEditor?: editor.IStandaloneCodeEditor;
    selectedFilePath?: string;
  }
}

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
  onContentChange?: (content: string) => void;
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
  ({ initialValue, language = 'plaintext', height = '80vh', isTreeView, onFileSelect, onContentChange }, ref) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const vimStatusBarRef = useRef<HTMLDivElement | null>(null);
    const vimModeRef = useRef<monaco.IDisposable | null>(null);
    const [disposables] = useState<monaco.IDisposable[]>([]);
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

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
        const editor = editorRef.current;
        if (editor) {
          editor.focus();
        }
      }
    }));

    const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
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
          keybindings: [monacoInstance.KeyCode.KeyJ],
          run: () => {
            const currentLine = editor.getPosition()?.lineNumber ?? 1;
            const model = editor.getModel();
            const nextLine = Math.min(currentLine + 1, model?.getLineCount() ?? 1);
            editor.setPosition({ lineNumber: nextLine, column: 1 });
            editor.revealLine(nextLine);
          }
        });
        disposables.push(moveDown);

        const moveUp = editor.addAction({
          id: 'moveUp',
          label: 'Move Up',
          keybindings: [monacoInstance.KeyCode.KeyK],
          run: () => {
            const currentLine = editor.getPosition()?.lineNumber ?? 1;
            const prevLine = Math.max(currentLine - 1, 1);
            editor.setPosition({ lineNumber: prevLine, column: 1 });
            editor.revealLine(prevLine);
          }
        });
        disposables.push(moveUp);

        const navigateBack = editor.addAction({
          id: 'navigateBack',
          label: 'Navigate Back',
          keybindings: [monacoInstance.KeyCode.Ctrl | monacoInstance.KeyCode.KeyO],
          run: () => {
            if (history.current.length > 0) {
              const previousState = history.current.pop();
              if (previousState) {
                const newContent = formatTreeContent(previousState.items);
                editor.setValue(newContent);
                editor.setPosition({ lineNumber: 1, column: 1 });
              }
            }
          }
        });
        disposables.push(navigateBack);

        const selectItem = editor.addAction({
          id: 'selectItem',
          label: 'Select Item',
          keybindings: [monacoInstance.KeyCode.Enter],
          run: () => {
            const currentLine = editor.getPosition()?.lineNumber ?? 1;
            const item = getItemAtLine(treeItemsState, currentLine);

            if (item != null) {
              if (item.type === 'directory') {
                const currentState = {
                  items: treeItemsState,
                  path: item.path
                };
                history.current.push(currentState);

                const newTreeItems = treeItemsState
                  .filter(t => {
                    const isChild = t.path.startsWith(item.path + '/');
                    const childDepth = t.path.split('/').length;
                    const parentDepth = item.path.split('/').length;
                    return isChild && childDepth === parentDepth + 1;
                  })
                  .sort((a, b) => {
                    if (a.type === 'directory' && b.type !== 'directory') return -1;
                    if (b.type === 'directory' && a.type !== 'directory') return 1;
                    return a.path.localeCompare(b.path);
                  });

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
      if (!isTreeView) return;

      const storedItems = localStorage.getItem('github_tree_items');
      if (!storedItems) {
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
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [updateTreeData]);

    useEffect(() => {
      if (isTreeView && editorRef.current) {
        updateTreeData();
      }
    }, [isTreeView, updateTreeData]);

    const editorContent = useMemo(() => {
      if (!isTreeView) return initialValue;
      if (error) return `Error: ${error}`;
      if (!initialized) return 'Loading...';
      if (treeItemsState.length === 0) return 'No files available\n\nKeyboard Shortcuts:\n  j/k - Move down/up\n  Enter - Open file/directory\n  Ctrl+o - Go back';

      try {
        return `Keyboard Shortcuts:\n  j/k - Move down/up\n  Enter - Open file/directory\n  Ctrl+o - Go back\n\n${formatTreeContent(treeItemsState)}`;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to format tree content';
        setError(message);
        return `Error: ${message}`;
      }
    }, [isTreeView, initialValue, error, treeItemsState, initialized]);

    const loadFileContent = useCallback((path: string) => {
      const content = localStorage.getItem(`github_file_content:${path}`);
      const editor = editorRef.current;
      if (content && editor) {
        editor.setValue(content);
        editor.setPosition({ lineNumber: 1, column: 1 });
        editor.revealLine(1);
        setCurrentFilePath(path);
      }
    }, []);

    useEffect(() => {
      if (onFileSelect) {
        const handleFileSelect = (e: Event) => {
          const event = e as CustomEvent<string>;
          loadFileContent(event.detail);
          onFileSelect(event.detail);
        };

        window.addEventListener('fileSelect', handleFileSelect as EventListener);
        return () => window.removeEventListener('fileSelect', handleFileSelect as EventListener);
      }
    }, [loadFileContent, onFileSelect]);

    useEffect(() => {
      const editor = editorRef.current;
      if (editor) {
        editor.updateOptions({
          readOnly: isTreeView,
          lineNumbers: isTreeView ? 'off' : 'on',
          wordWrap: isTreeView ? 'on' : 'off'
        });

        const currentValue = editor.getValue();
        if (currentValue !== editorContent) {
          editor.setValue(editorContent);
          editor.setPosition({ lineNumber: 1, column: 1 });
          editor.revealLine(1);
        }
      }
    }, [editorContent, isTreeView]);

    useEffect(() => {
      const editor = editorRef.current;
      if (!isTreeView && currentFilePath && onContentChange && editor) {
        const model = editor.getModel();
        if (model) {
          const contentListener = model.onDidChangeContent(() => {
            const content = model.getValue();
            localStorage.setItem(`github_file_content:${currentFilePath}`, content);
            onContentChange(content);
          });
          return () => contentListener.dispose();
        }
      }
    }, [isTreeView, currentFilePath, onContentChange]);

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

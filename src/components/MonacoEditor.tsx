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
    const editorRef = useRef<IStandaloneCodeEditor | null>(null);
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
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }
    }));

    const handleEditorDidMount = (
      editor: IStandaloneCodeEditor,
      _monaco: Monaco
    ) => {
      console.log('MonacoEditor: Editor mounted with props:', {
        isTreeView,
        initialValue,
        language,
        height
      });
      editorRef.current = editor;
      window.monacoEditor = editor;
      console.log('MonacoEditor: Editor reference set on window');
      console.log('MonacoEditor: isTreeView:', isTreeView);

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

        // Add back navigation action
        const navigateBack = editor.addAction({
          id: 'navigateBack',
          label: 'Navigate Back',
          keybindings: [KeyCode.Ctrl | KeyCode.KeyO],
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

                // Show only immediate children of the selected directory
                const newTreeItems = treeItemsState
                  .filter(t => {
                    const isChild = t.path.startsWith(item.path + '/');
                    const childDepth = t.path.split('/').length;
                    const parentDepth = item.path.split('/').length;
                    return isChild && childDepth === parentDepth + 1;
                  })
                  .sort((a, b) => {
                    // Directories first, then files
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
      console.log('MonacoEditor: updateTreeData called');
      if (!isTreeView) return;

      const storedItems = localStorage.getItem('github_tree_items');
      console.log('MonacoEditor: Retrieved github_tree_items from localStorage:', storedItems);
      console.log('MonacoEditor: isTreeView:', isTreeView);
      console.log('MonacoEditor: editorRef.current:', editorRef.current);
      if (!storedItems) {
        console.log('MonacoEditor: No tree items found in localStorage');
        setTreeItemsState([]);
        return;
      }

      try {
        const parsedItems: unknown = JSON.parse(storedItems);
        if (isGitHubTreeItems(parsedItems)) {
          console.log('MonacoEditor: Parsed github_tree_items:', parsedItems);
          const mappedItems = parsedItems.map(mapGitHubToLocalTreeItem);
          console.log('MonacoEditor: Mapped tree items:', mappedItems);
          setTreeItemsState(mappedItems);
          setInitialized(true);
          setError(null);
        } else {
          console.log('MonacoEditor: Invalid github_tree_items format:', parsedItems);
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
        console.log('MonacoEditor: Initial tree view mount - loading data');
        updateTreeData();
      }
    }, [isTreeView, updateTreeData]);

    useEffect(() => {
      if (isTreeView && !initialized) {
        console.log('MonacoEditor: Initializing tree view data');
        updateTreeData();
      }
    }, [isTreeView, initialized, updateTreeData]);

    useEffect(() => {
      const handleStorageChange = (event: StorageEvent) => {
        console.log('MonacoEditor: Storage event detected', {
          key: event.key,
          newValue: event.newValue
        });
        if (event.key === 'github_tree_items') {
          console.log('MonacoEditor: github_tree_items changed - updating');
          updateTreeData();
        }
      };

      console.log('MonacoEditor: Adding storage event listener');
      window.addEventListener('storage', handleStorageChange);
      return () => {
        console.log('MonacoEditor: Removing storage event listener');
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [updateTreeData]);

    // Manual refresh when tree view becomes active
    useEffect(() => {
      if (isTreeView && editorRef.current) {
        console.log('MonacoEditor: Tree view became active - refreshing data');
        updateTreeData();
      }
    }, [isTreeView]);

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
      if (content && editorRef.current) {
        editorRef.current.setValue(content);
        editorRef.current.setPosition({ lineNumber: 1, column: 1 });
        editorRef.current.revealLine(1);
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
      if (editorRef.current != null) {
        console.log('MonacoEditor: Updating editor content', {
          isTreeView,
          initialized,
          treeItemsState,
          editorContent
        });

        editorRef.current.updateOptions({
          readOnly: isTreeView,
          lineNumbers: isTreeView ? 'off' : 'on',
          wordWrap: isTreeView ? 'on' : 'off'
        });

        const currentValue = editorRef.current.getValue();
        if (currentValue !== editorContent) {
          console.log('MonacoEditor: Setting new editor content');
          editorRef.current.setValue(editorContent);
          editorRef.current.setPosition({ lineNumber: 1, column: 1 });
          editorRef.current.revealLine(1);
        } else {
          console.log('MonacoEditor: Content is already up to date');
        }
      }
    }, [editorContent, isTreeView, treeItemsState, initialized]);

    useEffect(() => {
      if (!isTreeView && currentFilePath && onContentChange) {
        const model = editorRef.current?.getModel();
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

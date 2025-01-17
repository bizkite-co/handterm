import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback, useMemo } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import type { IStandaloneCodeEditor, IDisposable } from '../types/monaco';
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
  ({ initialValue, language = 'plaintext', height = '80vh', isTreeView, treeItems = [], onFileSelect }, ref) => {
    const editorRef = useRef<IStandaloneCodeEditor | null>(null);
    const vimStatusBarRef = useRef<HTMLDivElement | null>(null);
    const vimModeRef = useRef<IDisposable | null>(null);
    const [expandedFolders] = useState<Set<string>>(new Set());
    const [disposables] = useState<IDisposable[]>([]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }
    }));

    const handleEditorDidMount = (
      editor: IStandaloneCodeEditor,
      monaco: Monaco
    ) => {
      editorRef.current = editor;
      // Expose editor instance to window for testing
      window.monacoEditor = editor;

      // Debug: Log initial editor content
      console.log('Editor mounted with content:', editor.getValue());
      console.log('Tree items:', treeItemsState);
      console.log('Expanded folders:', expandedFolders);

      if (vimStatusBarRef.current) {
        vimModeRef.current = initVimMode(editor, vimStatusBarRef.current);
      }

      if (isTreeView) {
        editor.updateOptions({ readOnly: true });

        // Add key bindings for tree navigation
        const moveDown = editor.addAction({
          id: 'moveDown',
          label: 'Move Down',
          keybindings: [monaco.KeyCode.KeyJ],
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
          keybindings: [monaco.KeyCode.KeyK],
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
          keybindings: [monaco.KeyCode.Enter],
          run: () => {
            const currentLine = editor.getPosition()?.lineNumber ?? 1;
            const item = getItemAtLine(treeItems, { expandedFolders }, currentLine);

            if (item != null) {
              if (item.type === 'directory') {
                if (expandedFolders.has(item.path)) {
                  expandedFolders.delete(item.path);
                } else {
                  expandedFolders.add(item.path);
                }
                const newContent = formatTreeContent(treeItems, { expandedFolders });
                editor.setValue(newContent);
                editor.setPosition({ lineNumber: currentLine, column: 1 });
              } else if (onFileSelect != null) {
                onFileSelect(item.path);
                // Expose selected path for testing
                window.selectedFilePath = item.path;
              }
            }
          }
        });
        disposables.push(selectItem);
      }
    };

    useEffect(() => {
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'github_tree_items' && isTreeView) {
          try {
            const parsedItems: unknown = JSON.parse(event.newValue ?? '[]');
            if (isGitHubTreeItems(parsedItems)) {
              setTreeItemsState(parsedItems.map(mapGitHubToLocalTreeItem));
            }
          } catch (error) {
            if (error instanceof Error) {
              console.error('Failed to parse updated github_tree_items:', error.message);
            }
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        if (vimModeRef.current != null) {
          vimModeRef.current.dispose();
        }
        disposables.forEach((d: monaco.IDisposable) => d?.dispose?.());
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [disposables, isTreeView ]);

    // Initialize state with localStorage data if available
    const initialTreeItems = (() => {
      try {
        const storedItems = localStorage.getItem('github_tree_items');
        if (!storedItems) return [];
        const parsedItems: unknown = JSON.parse(storedItems);
        if (isGitHubTreeItems(parsedItems)) {
          return parsedItems.map(mapGitHubToLocalTreeItem);
        }
        return [];
      } catch (error) {
        console.error('Failed to initialize tree items:', error);
        return [];
      }
    })();

    const [treeItemsState, setTreeItemsState] = useState<TreeItem[]>(initialTreeItems);
    const [initialized, setInitialized] = useState(initialTreeItems.length > 0);

    // Load and update tree data from localStorage
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
          console.error('Failed to parse github_tree_items:', error.message);
          setError(error.message);
          setTreeItemsState([]);
        }
      }
    }, [isTreeView]);

    // Initial load of tree data
    useEffect(() => {
      if (isTreeView) {
        updateTreeData();
      }
    }, [isTreeView, updateTreeData]);

    // Force initial load when mounted
    useEffect(() => {
      if (isTreeView && !initialized) {
        updateTreeData();
      }
    }, [isTreeView, initialized, updateTreeData]);

    // Handle localStorage changes
    useEffect(() => {
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'github_tree_items') {
          updateTreeData();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }, [updateTreeData]);

    const [showTreeView, setShowTreeView] = useState(isTreeView);
    const [error, setError] = useState<string | null>(null);

    // Synchronize showTreeView with isTreeView prop
    useEffect(() => {
      setShowTreeView(isTreeView);
      if (isTreeView) {
        updateTreeData();
      }
    }, [isTreeView, updateTreeData]);

    const toggleTreeView = useCallback(() => {
      setShowTreeView(prev => {
        const newValue = !prev;
        if (newValue) {
          updateTreeData();
        }
        return newValue;
      });
    }, [updateTreeData]);

    const editorContent = useMemo(() => {
      if (!showTreeView) return initialValue;
      if (error) return `Error: ${error}`;
      if (!initialized) return 'Loading...';
      try {
        const content = formatTreeContent(treeItemsState, { expandedFolders });
        console.log('Generated editor content:', content);
        return content;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to format tree content';
        setError(message);
        return `Error: ${message}`;
      }
    }, [showTreeView, initialValue, error, treeItemsState, expandedFolders, initialized]);

    // Show error state
    useEffect(() => {
      if (error != null && editorRef.current) {
        editorRef.current.setValue(`Error: ${error}`);
      }
    }, [error]);

    useEffect(() => {
      if (editorRef.current != null) {
        console.log('Updating editor options and content');
        console.log('Current editor value:', editorRef.current.getValue());
        console.log('New content to set:', editorContent);
        console.log('Tree items state:', treeItemsState);
        console.log('Show tree view:', showTreeView);
        console.log('Initialized:', initialized);

        editorRef.current.updateOptions({
          readOnly: showTreeView,
          lineNumbers: showTreeView ? 'off' : 'on'
        });

        const currentValue = editorRef.current.getValue();
        if (currentValue !== editorContent) {
          console.log('Content differs, updating editor');
          editorRef.current.setValue(editorContent);
          console.log('Editor content after update:', editorRef.current.getValue());

          // Reset cursor position
          editorRef.current.setPosition({ lineNumber: 1, column: 1 });
          editorRef.current.revealLine(1);
        } else {
          console.log('Content matches, skipping update');
        }
      } else {
        console.log('Editor ref is null, cannot update content');
      }
    }, [editorContent, showTreeView, treeItemsState, initialized]);

    return (
      <div style={{ height, width: '100%', position: 'relative' }}>
        <button
          data-testid="tree-view-toggle"
          onClick={toggleTreeView}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1,
            padding: '5px 10px',
            backgroundColor: showTreeView ? '#238636' : '#1f6feb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {showTreeView ? 'Hide Tree View' : 'Show Tree View'}
        </button>
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
          value={showTreeView ? editorContent : initialValue}
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

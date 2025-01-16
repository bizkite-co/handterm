import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor, IDisposable } from 'monaco-editor';
import { initVimMode } from 'monaco-vim';
import { formatTreeContent, getItemAtLine } from '../utils/treeFormatter';

interface TreeItem {
  path: string;
  type: 'file' | 'directory';
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

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  ({ initialValue, language = 'plaintext', height = '80vh', isTreeView, treeItems = [], onFileSelect }, ref) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const vimStatusBarRef = useRef<HTMLDivElement | null>(null);
    const vimModeRef = useRef<{ dispose: () => void } | null>(null);
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
      editor: editor.IStandaloneCodeEditor,
      monaco: Monaco
    ) => {
      editorRef.current = editor;

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
            const currentLine = editor.getPosition()?.lineNumber || 1;
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
            const currentLine = editor.getPosition()?.lineNumber || 1;
            const item = getItemAtLine(treeItems, { expandedFolders }, currentLine);

            if (item) {
              if (item.type === 'directory') {
                if (expandedFolders.has(item.path)) {
                  expandedFolders.delete(item.path);
                } else {
                  expandedFolders.add(item.path);
                }
                const newContent = formatTreeContent(treeItems, { expandedFolders });
                editor.setValue(newContent);
                editor.setPosition({ lineNumber: currentLine, column: 1 });
              } else if (onFileSelect) {
                onFileSelect(item.path);
              }
            }
          }
        });
        disposables.push(selectItem);
      }
    };

    useEffect(() => {
      return () => {
        if (vimModeRef.current) {
          vimModeRef.current.dispose();
        }
        disposables.forEach((d: IDisposable) => d?.dispose?.());
      };
    }, [disposables]);

    const [localTreeItems, setLocalTreeItems] = useState<TreeItem[]>([]);

    const isValidTreeItem = (item: unknown): item is TreeItem => {
      return (
        typeof item === 'object' &&
        item !== null &&
        'path' in item &&
        'type' in item &&
        (item.type === 'file' || item.type === 'directory')
      );
    };

    const isValidTreeItems = (items: unknown): items is TreeItem[] => {
      return Array.isArray(items) && items.every(isValidTreeItem);
    };

    useEffect(() => {
      if (isTreeView) {
        const storedItems = localStorage.getItem('github_tree_items');
        if (storedItems) {
          try {
            const parsedItems = JSON.parse(storedItems) as unknown;
            if (isValidTreeItems(parsedItems)) {
              setLocalTreeItems(parsedItems);
            } else {
              console.error('Invalid github_tree_items format');
            }
          } catch (error) {
            console.error('Failed to parse github_tree_items:', error);
          }
        }
      }
    }, [isTreeView]);

    const editorContent = isTreeView && (treeItems.length > 0 || localTreeItems.length > 0)
      ? formatTreeContent(treeItems.length > 0 ? treeItems : localTreeItems, { expandedFolders })
      : initialValue;

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
        <Editor
          height="100%"
          width="100%"
          language={language}
          value={editorContent}
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

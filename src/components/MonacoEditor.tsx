import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import Editor, { Monaco } from "@monaco-editor/react";
import { useReactiveLocation } from 'src/hooks/useReactiveLocation';
import { ActivityType } from 'src/types/Types';
import { formatTreeContent, getItemAtLine } from '../utils/treeFormatter';

interface TreeItem {
  path: string;
  type: string;
}

interface MonacoEditorProps {
  initialValue: string;
  language?: string;
  onClose?: () => void;
  height?: string;
  toggleVideo?: () => boolean;
  isTreeView?: boolean;
  treeItems?: TreeItem[];
  onFileSelect?: (path: string) => void;
}

declare global {
  interface Window {
    MonacoVim?: any;
    require: {
      config: (params: any) => void;
    };
  }
}

export interface MonacoEditorHandle {
  focus: () => void;
}

const handleEditSave = (value?: string): void => {
  localStorage.setItem('edit-content', JSON.stringify(value));
}

// Get language from file extension
function getLanguageFromPath(path: string | null | undefined): string {
  if (!path) return 'plaintext';
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
    case 'sass':
      return 'scss';
    case 'py':
      return 'python';
    case 'rb':
      return 'ruby';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'php':
      return 'php';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'yml':
    case 'yaml':
      return 'yaml';
    default:
      return 'plaintext';
  }
}

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  ({ initialValue, language, onClose, height = '80vh', toggleVideo, isTreeView, treeItems = [], onFileSelect }, ref) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const statusNodeRef = useRef<HTMLDivElement>(null);
    const { parseLocation, updateLocation } = useReactiveLocation();
    const [expandedFolders] = useState<Set<string>>(new Set());
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [disposables] = useState<any[]>([]);

    // Get current file path from location
    const currentLocation = parseLocation();
    const currentFile = currentLocation.contentKey;

    // Debug logging for props and state
    useEffect(() => {
      if (isTreeView) {
        console.log('MonacoEditor Tree View Props:', {
          isTreeView,
          treeItemsCount: treeItems.length,
          expandedFoldersCount: expandedFolders.size,
          isEditorReady
        });
        console.log('Tree Items:', treeItems);
      }
    }, [isTreeView, treeItems, expandedFolders, isEditorReady]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        // Dispose of any Monaco editor disposables
        disposables.forEach(d => d?.dispose?.());
        // Dispose of vim mode if active
        if (window.MonacoVim) {
          window.MonacoVim.VimMode.Vim.dispose();
        }
        // Clear editor reference
        editorRef.current = null;
        monacoRef.current = null;
      };
    }, [disposables]);

    const handleEditorClose = (): void => {
      if (onClose) {
        console.log('Closing editor');
        onClose();
      }
    }

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }
    }));

    function handleEditorDidMount(editor: any, monaco: Monaco) {
      console.log('Editor mounted, setting up...');
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Make editor read-only in tree view mode
      if (isTreeView) {
        console.log('Setting up tree view mode');
        editor.updateOptions({ readOnly: true });

        // Add key bindings for tree navigation
        const moveDown = editor.addAction({
          id: 'moveDown',
          label: 'Move Down',
          keybindings: [monaco.KeyCode.KeyJ],
          run: () => {
            console.log('Navigate Down triggered');
            const currentLine = editor.getPosition().lineNumber;
            const nextLine = Math.min(currentLine + 1, editor.getModel().getLineCount());
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
            console.log('Navigate Up triggered');
            const currentLine = editor.getPosition().lineNumber;
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
            console.log('Select Item triggered');
            const currentLine = editor.getPosition().lineNumber;
            const item = getItemAtLine(treeItems, { expandedFolders }, currentLine);
            console.log('Selected item:', item);

            if (item) {
              if (item.isDirectory) {
                console.log('Toggling directory:', item.path);
                if (expandedFolders.has(item.path)) {
                  expandedFolders.delete(item.path);
                } else {
                  expandedFolders.add(item.path);
                }
                const newContent = formatTreeContent(treeItems, { expandedFolders });
                editor.setValue(newContent);
                editor.setPosition({ lineNumber: currentLine, column: 1 });
              } else if (onFileSelect) {
                console.log('Opening file:', item.path);
                onFileSelect(item.path);
              }
            }
          }
        });
        disposables.push(selectItem);

        const closeTree = editor.addAction({
          id: 'closeTree',
          label: 'Close Tree',
          keybindings: [monaco.KeyCode.KeyE],
          run: handleEditorClose
        });
        disposables.push(closeTree);

        // Handle Spacebar + e for toggling tree view
        let spacebarPressed = false;
        const keyDownDisposable = editor.onKeyDown((e: any) => {
          if (e.keyCode === monaco.KeyCode.Space) {
            spacebarPressed = true;
          } else if (spacebarPressed && e.keyCode === monaco.KeyCode.KeyE) {
            handleEditorClose();
          } else {
            spacebarPressed = false;
          }
        });
        disposables.push(keyDownDisposable);

        const keyUpDisposable = editor.onKeyUp(() => {
          spacebarPressed = false;
        });
        disposables.push(keyUpDisposable);

        console.log('Tree view actions registered');
      } else {
        // Standard vim mode for non-tree views
        window.require.config({
          paths: {
            "monaco-vim": "https://unpkg.com/monaco-vim/dist/monaco-vim"
          }
        });

        // @ts-ignore
        window.require(["monaco-vim"], (MonacoVim: any) => {
          if (statusNodeRef.current) {
            MonacoVim.initVimMode(editor, statusNodeRef.current);
            const Vim = MonacoVim.VimMode.Vim;

            // Standard vim commands
            Vim.defineEx('w', '', () => {
              handleEditSave(editor.getValue());
            });

            Vim.defineEx('q', '', () => {
              handleEditorClose();
            });

            Vim.defineEx('wq', '', () => {
              handleEditSave(editor.getValue());
              handleEditorClose();
            });

            Vim.defineEx('vid', '', () => {
              if (toggleVideo) {
                toggleVideo();
              }
            });
          }
        });
      }

      setTimeout(() => {
        editor.focus();
        setIsEditorReady(true);
        console.log('Editor ready');
      }, 100);
    }

    // Format tree content if in tree view mode
    const editorContent = isTreeView && treeItems.length > 0
      ? formatTreeContent(treeItems, { expandedFolders })
      : initialValue;

    // Debug log the content being rendered
    useEffect(() => {
      if (isTreeView) {
        console.log('Tree View Content:', editorContent);
      }
    }, [isTreeView, editorContent]);

    // Determine language based on file extension or prop
    const editorLanguage = isTreeView ? 'plaintext' : (language || getLanguageFromPath(currentFile));

    // Use a unique key to force editor recreation when needed
    const editorKey = `${editorLanguage}-${isTreeView}-${currentFile || 'default'}`;

    return (
      <div className="monaco-editor-container">
        <Editor
          key={editorKey}
          height={height}
          defaultLanguage={editorLanguage}
          defaultValue={editorContent}
          onMount={handleEditorDidMount}
          onChange={isTreeView ? undefined : handleEditSave}
          theme="vs-dark"
          options={{
            lineNumbers: isTreeView ? 'off' : 'on',
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 0,
            readOnly: isTreeView,
            renderWhitespace: 'none',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            contextmenu: false,
            quickSuggestions: false,
            parameterHints: { enabled: false },
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'off',
            wordBasedSuggestions: 'off'
          }}
        />
        <div ref={statusNodeRef} className="status-node"></div>
      </div>
    );
  }
);

export default MonacoEditor;

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
  language: 'javascript' | 'typescript' | 'markdown' | 'plaintext';
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

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  ({ initialValue, language, onClose, height = '80vh', toggleVideo, isTreeView, treeItems = [], onFileSelect }, ref) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const statusNodeRef = useRef<HTMLDivElement>(null);
    const { parseLocation, updateLocation } = useReactiveLocation();
    const [expandedFolders] = useState<Set<string>>(new Set());

    // Debug logging for props and state
    useEffect(() => {
      if (isTreeView) {
        console.log('MonacoEditor Tree View Props:', {
          isTreeView,
          treeItemsCount: treeItems.length,
          expandedFoldersCount: expandedFolders.size
        });
        console.log('Tree Items:', treeItems);
      }
    }, [isTreeView, treeItems, expandedFolders]);

    const handleEditorClose = (): void => {
      updateLocation({
        activityKey: ActivityType.NORMAL,
        contentKey: null,
        groupKey: null
      })
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

      if (isTreeView) {
        console.log('Setting up tree view mode');
        editor.updateOptions({ readOnly: true });

        // Register tree view actions
        editor.addAction({
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

        editor.addAction({
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

        editor.addAction({
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

        editor.addAction({
          id: 'closeTree',
          label: 'Close Tree',
          keybindings: [monaco.KeyCode.KeyE],
          run: () => {
            console.log('Close triggered');
            if (onClose) {
              onClose();
            }
          }
        });

        // Handle Spacebar + e for toggling tree view
        let spacebarPressed = false;
        editor.onKeyDown((e: any) => {
          if (e.keyCode === monaco.KeyCode.Space) {
            spacebarPressed = true;
          } else if (spacebarPressed && e.keyCode === monaco.KeyCode.KeyE) {
            if (onClose) {
              onClose();
            }
          } else {
            spacebarPressed = false;
          }
        });

        editor.onKeyUp(() => {
          spacebarPressed = false;
        });

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
              if (onClose) {
                onClose();
              }
            });

            Vim.defineEx('wq', '', () => {
              handleEditSave(editor.getValue());
              if (onClose) {
                onClose();
              }
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

    return (
      <div className="monaco-editor-container">
        <Editor
          key={`${language}-${isTreeView}`}
          height={height}
          defaultLanguage={isTreeView ? 'plaintext' : language}
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

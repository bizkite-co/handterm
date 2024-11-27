import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import Editor from "@monaco-editor/react";
import { useReactiveLocation } from 'src/hooks/useReactiveLocation';
import { ActivityType } from 'src/types/Types';
import { formatTreeContent } from '../utils/treeFormatter';

interface MonacoEditorProps {
  initialValue: string;
  language: 'javascript' | 'typescript' | 'markdown' | 'plaintext';
  onClose?: () => void;
  height?: string;
  toggleVideo?: () => boolean;
  isTreeView?: boolean;
  treeItems?: Array<{ path: string; type: string }>;
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
  ({ initialValue, language, onClose, height = '80vh', toggleVideo, isTreeView, treeItems, onFileSelect }, ref) => {
    const editorRef = useRef<any>(null);
    const statusNodeRef = useRef<HTMLDivElement>(null);
    const { parseLocation, updateLocation } = useReactiveLocation();
    const [selectedLine, setSelectedLine] = useState<number>(2); // Start after header

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

    useEffect(() => {
      return () => {
        if (window.MonacoVim) {
          window.MonacoVim.VimMode.Vim.dispose();
        }
      };
    }, []);

    function handleEditorDidMount(editor: any, monaco: any) {
      editorRef.current = editor;
      setTimeout(() => editor.focus(), 100);

      // Make editor read-only in tree view mode
      if (isTreeView) {
        editor.updateOptions({ readOnly: true });
      }

      window.require.config({
        paths: {
          "monaco-vim": "https://unpkg.com/monaco-vim/dist/monaco-vim"
        }
      });

      // @ts-ignore
      window.require(["monaco-vim"], (MonacoVim: any) => {
        if (statusNodeRef.current) {
          const vimMode = MonacoVim.initVimMode(editor, statusNodeRef.current);
          const Vim = MonacoVim.VimMode.Vim;

          // Define tree-specific commands when in tree view mode
          if (isTreeView && treeItems) {
            const lines = editor.getModel().getLinesContent();
            const fileLineNumbers = lines
              .map((line: string, index: number) => line.includes('📄') ? index + 1 : -1)
              .filter((num: number) => num !== -1);

            // Navigate down
            vimMode.addKeyMap('j', 'normal', () => {
              const currentLine = editor.getPosition().lineNumber;
              const nextLine = Math.min(currentLine + 1, lines.length);
              editor.setPosition({ lineNumber: nextLine, column: 1 });
              editor.revealLine(nextLine);
              return true;
            });

            // Navigate up
            vimMode.addKeyMap('k', 'normal', () => {
              const currentLine = editor.getPosition().lineNumber;
              const prevLine = Math.max(currentLine - 1, 1);
              editor.setPosition({ lineNumber: prevLine, column: 1 });
              editor.revealLine(prevLine);
              return true;
            });

            // Select file with Enter
            vimMode.addKeyMap('<CR>', 'normal', () => {
              const currentLine = editor.getPosition().lineNumber;
              const lineContent = lines[currentLine - 1];
              if (lineContent.includes('📄') && onFileSelect) {
                const filePath = lineContent.match(/📄\s+(.+)$/)?.[1]?.trim();
                if (filePath) {
                  onFileSelect(filePath);
                }
              }
              return true;
            });

            // Toggle tree view with 'e'
            vimMode.addKeyMap('e', 'normal', () => {
              if (onClose) {
                onClose();
              }
              return true;
            });
          }

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

    // Format tree content if in tree view mode
    const editorContent = isTreeView && treeItems
      ? formatTreeContent(treeItems)
      : initialValue;

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
            wordWrap: 'on'
          }}
        />
        <div ref={statusNodeRef} className="status-node"></div>
      </div>
    );
  }
);

export default MonacoEditor;

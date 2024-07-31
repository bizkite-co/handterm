// src/components/CodeMirrorEditor.tsx

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { vim, Vim } from '@replit/codemirror-vim';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import './CodeMirrorEditor.css';

// Debounce function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface CodeMirrorEditorProps {
  initialValue: string;
  language: 'javascript' | 'typescript' | 'markdown';
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
}

interface CodeMirrorEditorHandle {
  focus: () => void;
  editorView: EditorView | null;
}

const CodeMirrorEditor = forwardRef<CodeMirrorEditorHandle, CodeMirrorEditorProps>((props, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (viewRef.current) {
        viewRef.current.focus();
      }
    },
    get editorView() {
      return viewRef.current;
    }
  }), []);

  useEffect(() => {
    if (editorRef.current) {
      const extensions = [
        vim(),
        basicSetup,
        EditorView.updateListener.of(debounce((update) => {
          if (update.docChanged && props.onChange) {
            props.onChange(update.state.doc.toString());
          }
        }, 300)),
      ];

      switch (props.language) {
        case 'typescript':
          extensions.push(javascript({ typescript: true }));
          break;
        case 'markdown':
          extensions.push(markdown());
          break;
        case 'javascript':
        default:
          extensions.push(javascript());
          break;
      }

      const view = new EditorView({
        doc: props.initialValue,
        extensions,
        parent: editorRef.current,
      });

      // Attach the onSave handler to the view instance
      (view as any)._handlers = {
        onSave: (docContent: string) => {
          if (props.onSave) {
            props.onSave(docContent);
          }
        },
      };

      // Pass the EditorView instance to custom Vim commands
      Vim.defineEx('q', '', (cm: any) => {
        const editorElement = cm.getWrapperElement();
        if (editorElement) {
          editorElement.style.display = 'none'; // Hide the editor
        }
      });

      Vim.defineEx('wq', '', (cm: any) => {
        const editorElement = cm.getWrapperElement();
        if (editorElement) {
          const docContent = view.state.doc.toString();
          if ((view as any)._handlers && (view as any)._handlers.onSave) {
            (view as any)._handlers.onSave(docContent);
          }
          editorElement.style.display = 'none'; // Hide the editor
        }
      });

      viewRef.current = view;

      return () => view.destroy();
    }
  }, [props.initialValue, props.language, props.onChange, props.onSave]);

  return <div ref={editorRef} />;
});

export default CodeMirrorEditor;
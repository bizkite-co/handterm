// src/components/CodeMirrorEditor.tsx
import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { vim } from '@replit/codemirror-vim';
import { javascript } from '@codemirror/lang-javascript';

interface CodeMirrorEditorProps {
  initialValue: string;
  onChange?: (value: string) => void;
}

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({ initialValue, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      const view = new EditorView({
        doc: initialValue,
        extensions: [
          vim(), // Enable Vim keybindings
          basicSetup,
          javascript(),
          EditorView.updateListener.of((update: { docChanged: any; }) => {
            if (update.docChanged && onChange) {
              onChange(view.state.doc.toString());
            }
          }),
        ],
        parent: editorRef.current,
      });

      return () => view.destroy();
    }
  }, [initialValue, onChange]);

  return <div ref={editorRef} />;
};

export default CodeMirrorEditor;
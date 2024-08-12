// Taken from https://codesandbox.io/s/monaco-editorvim-jy8ox?file=/src/index.js:0-1495
import React from "react";
import ReactDOM from "react-dom";

import codeExample from "./codeExample";
import Editor from "@monaco-editor/react";

const App = () => {
  function handleEditorDidMount(editor, monaco) {
    // setup key bindings before monaco-vim setup

    // setup key bindings
    editor.addAction({
      // an unique identifier of the contributed action
      id: "some-unique-id",
      // a label of the action that will be presented to the user
      label: "Some label!",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],

      // the method that will be executed when the action is triggered.
      run: function (editor) {
        alert("we wanna save something => " + editor.getValue());
        return null;
      }
    });

    // setup monaco-vim
    window.require.config({
      paths: {
        "monaco-vim": "https://unpkg.com/monaco-vim/dist/monaco-vim"
      }
    });

    window.require(["monaco-vim"], function (MonacoVim) {
      const statusNode = document.querySelector(".status-node");
      MonacoVim.initVimMode(editor, statusNode);
    });
  }

  return (
    <div>
      <Editor
        height="90vh"
        language="javascript"
        wrapperClassName="something"
        onMount={handleEditorDidMount}
        defaultValue={codeExample}
        theme="vs-dark"
      />
      <code className="status-node"></code>
    </div>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

# Phase 2: Monaco Implementation - Plan for MonacoTerminal.tsx

*   **Status:** In Progress
*   **Parent:** [`_index.md`](./_index.md)

## Goal:

Implement a React component `MonacoTerminal.tsx` that renders the Monaco Editor and integrates with the `useMonacoTerminal` hook to provide a functional terminal interface.

## Dependencies:

*   `useMonacoTerminal` hook (already created).
*   `ITerminalAdapter` interface.
*   Monaco Editor React component or direct API usage (as determined in `useMonacoTerminal` plan).
*   Styling for the terminal container.

## High-Level Steps:

1.  **Scaffold `MonacoTerminal.tsx`:** Create the new file `src/components/MonacoTerminal.tsx` and define the basic component structure.
2.  **Integrate `useMonacoTerminal` hook:** Call the `useMonacoTerminal` hook within the component to get the `ITerminalAdapter` instance.
3.  **Render Monaco Editor:** Render the Monaco Editor within the component, ensuring it uses the `ref` provided by `useMonacoTerminal` (or directly manages the editor instance if `useMonacoTerminal` handles initialization).
4.  **Apply Styling:** Add appropriate CSS to ensure the Monaco Editor fills its container and is visible.
5.  **Expose imperative methods (if needed):** If `HandTermWrapper` needs to directly call methods on the `MonacoTerminal` component (e.g., `focus`), use `useImperativeHandle`.
6.  **Replace XTerm in `HandTermWrapper.tsx`:** Modify `HandTermWrapper.tsx` to render `MonacoTerminal.tsx` instead of the XTerm-related elements.

## Detailed Steps:

*   **Step 1: Scaffold `MonacoTerminal.tsx`**
    *   Create `src/components/MonacoTerminal.tsx`.
    *   Add a basic React functional component structure:
        ```typescript
        // src/components/MonacoTerminal.tsx
        import React, { useRef, useEffect } from 'react';
        import { useMonacoTerminal } from '../hooks/useMonacoTerminal'; // Adjust path as needed

        interface MonacoTerminalProps {
          // Define any props needed for the component, e.g., initial content, theme
        }

        export const MonacoTerminal: React.FC<MonacoTerminalProps> = () => {
          const terminalRef = useRef<HTMLDivElement>(null);
          const terminalAdapter = useMonacoTerminal(terminalRef); // Pass the ref to the hook

          useEffect(() => {
            // Any additional setup or event listeners for the component
            // For example, if useMonacoTerminal doesn't handle initial focus, do it here
            terminalAdapter.focus();
          }, [terminalAdapter]);

          return (
            <div
              ref={terminalRef}
              id="monaco-terminal-container"
              style={{
                height: '100%', // Ensure it fills the parent
                width: '100%',
                // Add any specific styling for the Monaco editor container
              }}
            />
          );
        };
        ```

*   **Step 2: Integrate `useMonacoTerminal` hook**
    *   As shown in the scaffolding, the `useMonacoTerminal` hook will be called, and its returned `ITerminalAdapter` will be used. The `terminalRef` will be passed to the hook for Monaco to attach to.

*   **Step 3: Render Monaco Editor**
    *   The `useMonacoTerminal` hook is responsible for initializing and managing the Monaco Editor instance. The `MonacoTerminal` component will provide the `div` element (`terminalRef`) for Monaco to render into.

*   **Step 4: Apply Styling**
    *   Ensure the `div` with `id="monaco-terminal-container"` has `height: '100%'` and `width: '100%'` to properly fill its parent. Additional styling might be needed for borders, background, etc., which can be added directly or via a CSS module.

*   **Step 5: Expose imperative methods (if needed)**
    *   Review `HandTermWrapper.tsx` to see if it calls any imperative methods on the `terminal` object that are not directly part of `ITerminalAdapter` (e.g., `prompt`, `saveCommandResponseHistory`). If so, these might need to be exposed via `useImperativeHandle` in `MonacoTerminal.tsx` or refactored into the `ITerminalAdapter`.
    *   Currently, `HandTermWrapper` uses `terminal.write`, `terminal.focus`, and `terminal.resetPrompt`. These are part of `ITerminalAdapter` and will be handled by `useMonacoTerminal`.

*   **Step 6: Replace XTerm in `HandTermWrapper.tsx`**
    *   Open `src/components/HandTermWrapper.tsx`.
    *   Remove the `useTerminal` import and usage.
    *   Import `MonacoTerminal`.
    *   Replace the `div` with `id="terminal-container"` (lines 253-259) with the `MonacoTerminal` component.
    *   Adjust any props passed to `MonacoTerminal` as necessary.

```mermaid
graph TD
    A[Start: Create MonacoTerminal.tsx] --> B[Scaffold MonacoTerminal.tsx];
    B --> C[Integrate useMonacoTerminal Hook];
    C --> D[Render Monaco Editor (via hook)];
    D --> E[Apply Styling to Container];
    E --> F[Review HandTermWrapper for Imperative Calls];
    F --> G{Are there non-ITerminalAdapter imperative calls?};
    G -- Yes --> H[Expose methods via useImperativeHandle];
    G -- No --> I[Proceed];
    H --> I;
    I --> J[Modify HandTermWrapper.tsx];
    J --> K[Remove useTerminal import/usage];
    J --> L[Import MonacoTerminal];
    J --> M[Replace XTerm container with MonacoTerminal];
    M --> N[End: MonacoTerminal.tsx Component Created];
# Phase 2: Monaco Implementation - Plan for MonacoCore.tsx Refactor and Terminal Integration

*   **Status:** In Progress
*   **Parent:** [`_index.md`](./_index.md)

## Goal:

Modify `MonacoCore.tsx` to be a versatile component that can function as both a code editor and a terminal, and then integrate it into `HandTermWrapper.tsx` to display the terminal output correctly.

## Dependencies:

*   `ITerminalAdapter` interface.
*   `useMonacoTerminal` hook.
*   Existing `MonacoCore.tsx` and `HandTermWrapper.tsx`.
*   `EditorPage.ts` for Playwright testing considerations.

## High-Level Steps:

1.  **Define `MonacoCore` Modes:** Introduce a `mode` prop to `MonacoCore.tsx` (e.g., `'editor'` or `'terminal'`) to control its behavior.
2.  **Abstract Monaco Configuration:** Create a utility function or object to manage Monaco Editor options based on the `mode`.
3.  **Conditional Logic in `MonacoCore`:** Implement conditional logic within `MonacoCore.tsx` to adjust its behavior (e.g., initial value, read-only state, keybindings, status bar visibility) based on the `mode` prop.
4.  **Adapt `useMonacoTerminal`:** Modify `useMonacoTerminal.ts` to accept a `MonacoCore` instance (or its ref) and expose `ITerminalAdapter` methods that interact with `MonacoCore`'s internal Monaco editor instance.
5.  **Create `MonacoTerminal.tsx` (Thin Wrapper):** Create `MonacoTerminal.tsx` as a simple wrapper that renders `MonacoCore` in `'terminal'` mode and passes the necessary props from `useMonacoTerminal`.
6.  **Integrate `MonacoTerminal` into `HandTermWrapper.tsx`:** Replace the existing XTerm integration in `HandTermWrapper.tsx` with `MonacoTerminal.tsx`.
7.  **Verify Terminal Display:** Ensure the terminal loads and displays correctly in the web app.
8.  **Update Playwright Tests:** Review and update `EditorPage.ts` and related Playwright tests to accommodate the refactored `MonacoCore` and `MonacoTerminal`.

## Detailed Steps:

*   **Step 1: Define `MonacoCore` Modes**
    *   Modify `MonacoCoreProps` in `src/components/MonacoCore.tsx` to include a `mode` property:
        ```typescript
        interface MonacoCoreProps {
          value: string;
          language?: string;
          toggleVideo?: () => boolean;
          mode: 'editor' | 'terminal'; // Add this prop
          onTerminalReady?: (adapter: ITerminalAdapter) => void; // For terminal mode
        }
        ```

*   **Step 2: Abstract Monaco Configuration**
    *   Create a helper function (e.g., `getMonacoOptions(mode: 'editor' | 'terminal')`) that returns `monaco.editor.IEditorOptions` based on the mode.
    *   For `'terminal'` mode, options might include:
        *   `readOnly: false` (for input)
        *   `lineNumbers: 'off'`
        *   `wordWrap: 'on'`
        *   `overviewRulerLanes: 0`
        *   `hideCursorInOverviewRuler: true`
        *   `scrollBeyondLastLine: false`
        *   `minimap: { enabled: false }`
        *   `scrollbar: { vertical: 'hidden', horizontal: 'hidden' }`
        *   `renderLineHighlight: 'none'`
        *   `contextmenu: false`
        *   `quickSuggestions: false`
        *   `hover: { enabled: false }`
        *   `links: false`
        *   `cursorStyle: 'block'`
        *   `fontFamily: 'monospace'`
        *   `fontSize: 14` (or a configurable value)
    *   For `'editor'` mode, use existing options.

*   **Step 3: Conditional Logic in `MonacoCore`**
    *   In `MonacoCore.tsx`, use the `mode` prop to:
        *   Apply the correct `monaco.editor.create` options.
        *   Conditionally render the `vim-status-bar` (only for `'editor'` mode, or a different status for `'terminal'`).
        *   Adjust initial `value` and `language` defaults.
        *   Handle `Enter` key differently: in `'terminal'` mode, it should trigger command submission, not just a newline. This will require passing a `onEnter` callback prop.
        *   Manage Vim mode: `initVimMode` might only be needed for `'editor'` mode, or configured differently for `'terminal'` (e.g., always in insert mode).

*   **Step 4: Adapt `useMonacoTerminal`**
    *   Modify `src/hooks/useMonacoTerminal.ts` to:
        *   No longer create its own Monaco instance. Instead, it will receive the `monaco.editor.IStandaloneCodeEditor` instance from `MonacoCore` (e.g., via a callback prop `onEditorReady` passed to `MonacoCore`).
        *   Implement `ITerminalAdapter` methods by interacting with this received editor instance.
        *   The `ref` parameter to `useMonacoTerminal` might become obsolete or be used for the `MonacoTerminal` wrapper's root `div`.

*   **Step 5: Create `MonacoTerminal.tsx` (Thin Wrapper)**
    *   Update `src/components/MonacoTerminal.tsx` to:
        *   Import `MonacoCore`.
        *   Call `useMonacoTerminal` to get the adapter.
        *   Render `MonacoCore` with `mode="terminal"`.
        *   Pass the `onEditorReady` callback to `MonacoCore` so `useMonacoTerminal` can get the editor instance.
        *   Pass `terminalAdapter.onData` and `terminalAdapter.onResize` (if applicable) as props to `MonacoCore`.

*   **Step 6: Integrate `MonacoTerminal` into `HandTermWrapper.tsx`**
    *   In `src/components/HandTermWrapper.tsx`:
        *   Remove the import for `useTerminal`.
        *   Import `MonacoTerminal`.
        *   Replace the `div` with `id="terminal-container"` (lines 253-259) with `<MonacoTerminal />`.
        *   The `terminalContainerRef` will no longer be needed for `useTerminal`. The `MonacoTerminal` component will manage its own internal ref for `MonacoCore`.

*   **Step 7: Verify Terminal Display**
    *   After implementing the changes, run the application and verify that the Monaco-based terminal is visible and functional.
    *   Check for initial prompt, ability to type, and basic output.

*   **Step 8: Update Playwright Tests**
    *   Review `src/e2e/page-objects/EditorPage.ts`.
    *   The `EditorPage` currently assumes a single Monaco editor instance (`window.monacoEditor`). This will need to be adapted if `MonacoCore` is used for both editor and terminal.
    *   Consider creating a `TerminalPage.ts` or extending `EditorPage` to handle terminal-specific interactions.
    *   Ensure tests for editor mode still pass.
    *   Write new tests for terminal mode functionality (typing, command submission, output).

```mermaid
graph TD
    A[Start Refactoring MonacoCore] --> B{Add 'mode' prop to MonacoCore};
    B --> C[Create getMonacoOptions utility];
    C --> D[Implement Conditional Logic in MonacoCore];
    D --> D1[Apply mode-specific options];
    D --> D2[Conditional status bar rendering];
    D --> D3[Handle Enter key via callback];
    D --> D4[Configure Vim mode conditionally];
    D --> E[Adapt useMonacoTerminal Hook];
    E --> E1[Receive editor instance from MonacoCore];
    E --> E2[Implement ITerminalAdapter methods using received instance];
    E --> F[Create MonacoTerminal.tsx Wrapper];
    F --> F1[Render MonacoCore with mode='terminal'];
    F --> F2[Pass onEditorReady callback to MonacoCore];
    F --> G[Integrate MonacoTerminal into HandTermWrapper.tsx];
    G --> G1[Remove useTerminal import/usage];
    G --> G2[Replace XTerm div with MonacoTerminal];
    G --> H[Verify Terminal Display in Web App];
    H --> I[Update Playwright Tests];
    I --> J[End Refactoring];
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

1.  **Define `MonacoCore` Modes:** Introduce a `mode` prop to `MonacoCore.tsx` (e.g., `'editor'` or `'terminal'`) to control its behavior. **(Completed)**
2.  **Abstract Monaco Configuration:** Create a utility function or object to manage Monaco Editor options based on the `mode`. **(Completed)**
3.  **Conditional Logic in `MonacoCore`:** Implement conditional logic within `MonacoCore.tsx` to adjust its behavior (e.g., initial value, read-only state, keybindings, status bar visibility) based on the `mode` prop. **(Completed)**
4.  **Adapt `useMonacoTerminal`:** Modify `useMonacoTerminal.ts` to accept a `MonacoCore` instance (or its ref) and expose `ITerminalAdapter` methods that interact with `MonacoCore`'s internal Monaco editor instance. **(Completed)**
5.  **Create `MonacoTerminal.tsx` (Thin Wrapper):** Create `MonacoTerminal.tsx` as a simple wrapper that renders `MonacoCore` in `'terminal'` mode and passes the necessary props from `useMonacoTerminal`. **(Completed)**
6.  **Integrate `MonacoTerminal` into `HandTermWrapper.tsx`:** Replace the existing XTerm integration in `HandTermWrapper.tsx` with `MonacoTerminal.tsx`. **(Completed)**
7.  **Verify Terminal Display:** Ensure the terminal loads and displays correctly in the web app.
8.  **Update Playwright Tests:** Review and update `EditorPage.ts` and related Playwright tests to accommodate the refactored `MonacoCore` and `MonacoTerminal`.

## Detailed Steps:

*   **Step 1: Define `MonacoCore` Modes**
    *   Modified `MonacoCoreProps` in `src/components/MonacoCore.tsx` to include `mode`, `onTerminalReady`, `onEditorReady`, and `onEnter` properties.

*   **Step 2: Abstract Monaco Configuration**
    *   Created a `getMonacoOptions` helper function in `MonacoCore.tsx` that returns `monaco.editor.IEditorOptions` based on the mode.

*   **Step 3: Conditional Logic in `MonacoCore`**
    *   Implemented conditional logic in `MonacoCore.tsx` to apply mode-specific options, conditionally render the `vim-status-bar`, and handle the `Enter` key differently for terminal mode. Vim mode initialization is now conditional on `editor` mode.

*   **Step 4: Adapt `useMonacoTerminal`**
    *   Modified `src/hooks/useMonacoTerminal.ts` to accept a `monaco.editor.IStandaloneCodeEditor` instance directly and implement `ITerminalAdapter` methods using this instance.

*   **Step 5: Create `MonacoTerminal.tsx` (Thin Wrapper)**
    *   Created `src/components/MonacoTerminal.tsx` to import `MonacoCore`, call `useMonacoTerminal`, and render `MonacoCore` in `'terminal'` mode, passing `onEditorReady` and `onEnter` callbacks.

*   **Step 6: Integrate `MonacoTerminal` into `HandTermWrapper.tsx`**
    *   In `src/components/HandTermWrapper.tsx`, removed the `useTerminal` import and usage, replaced the XTerm div with `<MonacoTerminal />`, and updated `useImperativeHandle` to use the `ITerminalAdapter` methods. Also, the `ITerminalAdapter` type is now imported directly from `@handterm/types`.

*   **Step 7: Verify Terminal Display**
    *   (Pending)

*   **Step 8: Update Playwright Tests**
    *   (Pending)

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
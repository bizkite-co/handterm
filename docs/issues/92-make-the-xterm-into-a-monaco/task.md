# Task Continuation: Monaco Terminal Refactor and UI Fixes

This document provides the context and current status for continuing the Monaco Terminal refactor and UI fixes.

## Original Goal:
Modify `MonacoCore.tsx` to be a versatile component that can function as both a code editor and a terminal, and then integrate it into `HandTermWrapper.tsx` to display the terminal output correctly.

## Current Status:
*   The "Uncaught Error: InstantiationService has been disposed" error has been resolved.
*   The application is running in the browser without critical errors.
*   Automated Playwright E2E tests are currently paused due to persistent TypeScript transpilation issues (`SyntaxError: TypeScript enum is not supported in strip-only mode`). This will be revisited later.
*   The logging level in `src/utils/Logger.ts` has been set to `LogLevel.WARN` to reduce verbosity.

## Remaining Issues to Address:
1.  **`src/components/MonacoCore.tsx` Linting/TypeScript Errors:**
    *   `Property 'VimMode' does not exist on type 'typeof import("monaco-vim")'.` (lines 25, 28)
    *   `Cannot find name 'IDisposable'.` (line 117)
    *   `Cannot find name 'IWindowWithMonacoEditor'.` (lines 145, 157)
    *   These errors indicate incorrect imports and type definitions for `monaco-vim`, `IDisposable`, and `IWindowWithMonacoEditor`.

2.  **"Gutter" Issue in Monaco Terminal:**
    *   The Monaco Terminal still displays a "gutter" of about 3 character widths on the left side. This needs to be removed by applying appropriate Monaco Editor options.

3.  **Missing Prompt in Monaco Terminal:**
    *   The terminal does not display a prompt. This needs to be implemented.

4.  **Incorrect `Enter` Key Behavior:**
    *   Hitting `ENTER` clears the terminal but does not submit commands for processing. The command submission logic needs to be integrated with the existing command handling.

5.  **Slow Typing Performance:**
    *   Typing in the terminal is very slow. This needs investigation and optimization, potentially related to the `onData` callback in `useMonacoTerminal.ts` or other rendering bottlenecks.

## Next Steps (Detailed Plan):

1.  **Address `src/components/MonacoCore.tsx` Linting/TypeScript Errors:**
    *   **Correct `monaco-vim` import and usage:** Revert the `monaco-vim` import to `import { initVimMode } from 'monaco-vim';` and `import * as monacoVim from 'monaco-vim';`. Access `VimMode` via `monacoVim.VimMode`.
    *   **Correct `IDisposable` import:** Import `IDisposable` from `monaco-editor/esm/vs/editor/editor.api`.
    *   **`IWindowWithMonacoEditor`:** Ensure this global interface is correctly declared in `packages/types/src/monaco.ts` (no import needed in `MonacoCore.tsx`).

2.  **Address the "Gutter" Issue in `MonacoCore.tsx`:**
    *   Apply the suggested Monaco Editor options (`"glyphMargin": false`, `"folding": false`, `"lineNumbers": "off"`, `"lineDecorationsWidth": 0`, `"lineNumbersMinChars": 0`) to the `getMonacoOptions` function for `terminal` mode.

3.  **Implement Prompt Display:**
    *   In `src/components/MonacoTerminal.tsx`, introduce a `prompt` prop.
    *   In `src/components/MonacoCore.tsx`, when in `terminal` mode, display the `prompt` at the beginning of the line.

4.  **Integrate `Enter` Key Command Submission:**
    *   In `src/components/MonacoCore.tsx`, modify the `editorInstance.addAction` for the `Enter` key in `terminal` mode to pass `lineContent` to the `onEnter` prop.
    *   In `src/components/MonacoTerminal.tsx`, ensure the `onEnter` prop is correctly passed down to `MonacoCore`.
    *   In `src/components/HandTermWrapper.tsx`, implement the `handleTerminalEnter` callback to process the command received from `MonacoTerminal`.

5.  **Address Slow Typing Performance:**
    *   Investigate and optimize the `onData` callback in `src/hooks/useMonacoTerminal.ts` and other potential rendering bottlenecks.

6.  **Manually Verify UI Functionality:** After implementing the fixes, manually test the application to confirm that the Monaco Terminal loads, displays correctly (without the gutter), and functions responsively with the prompt.

## Relevant Files:
*   `src/components/MonacoCore.tsx`
*   `src/components/MonacoTerminal.tsx`
*   `src/components/HandTermWrapper.tsx`
*   `src/hooks/useMonacoTerminal.ts`
*   `packages/types/src/monaco.ts`
*   `src/utils/Logger.ts`
*   `src/constants/terminal.ts`
*   `src/signals/appSignals.ts`
*   `src/signals/commandLineSignals.ts`
*   `src/utils/commandUtils.ts`
*   `src/hooks/useCharacterHandler.ts`
*   `src/hooks/useCommand.ts`
*   `src/hooks/useWPMCaculator.ts`
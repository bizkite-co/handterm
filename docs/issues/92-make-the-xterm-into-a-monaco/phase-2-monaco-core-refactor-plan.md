# Phase 2: Monaco Implementation - Plan for MonacoCore.tsx Refactor and Terminal Integration

*   **Status:** Blocked (UI functional, but with issues; tests failing)
*   **Parent:** [`_index.md`](./_index.md)

## Goal:

Modify `MonacoCore.tsx` to be a versatile component that can function as both a code editor and a terminal, and then integrate it into `HandTermWrapper.tsx` to display the terminal output correctly.

## Guiding Principles:

*   `MonacoCore` must accept a `mode` parameter (either "editor" or "terminal") to control its behavior. This parameter is now required for `MonacoCore` and has been added to relevant test specifications.

## Remaining High-Level Steps: (Revised based on current status)

 1.  **Address remaining `MonacoCore.tsx` linting/TypeScript errors:**
     *   Correct `monaco-vim` imports and usage.
     *   Ensure `IDisposable` is imported from `monaco-editor/esm/vs/editor/editor.api`.
     *   Ensure `IWindowWithMonacoEditor` is correctly declared globally (no import needed in `MonacoCore.tsx`).
     *   Remove unused `initRan` ref.
 2.  **Address the "Gutter" Issue:** Apply Monaco Editor options (`"glyphMargin": false`, etc.) in `MonacoCore.tsx` for terminal mode.
 3.  **Implement Prompt Display:** Modify `MonacoTerminal.tsx` and `MonacoCore.tsx` to display the terminal prompt.
 4.  **Integrate `Enter` Key Command Submission:** Implement command processing for the `Enter` key in `useMonacoTerminal.ts` and `MonacoCore.tsx`, and integrate with `HandTermWrapper.tsx`.
 5.  **Address Slow Typing Performance:** Investigate and optimize `onData` callback in `useMonacoTerminal.ts` and other potential bottlenecks.
 6.  **Revisit Automated Test Failures:** (Lower priority, after UI is stable).
 7.  **Address Browser Warning:** "Initial Sync: Signal (normal) differs from URL (tutorial). Synchronizing signal." (Lower priority).

## Notes & Issues:

*   The `getTimestamp` function in `src/components/HandTermWrapper.tsx` has been corrected to `date.toTimeString().split(' ')[0]`.
*   **Persistent `ITerminalAdapter` Module Resolution Issue:** The linting error `Unable to resolve path to module '@handterm/types/monaco'` for `ITerminalAdapter` in `src/components/HandTermWrapper.tsx` persists. This indicates a deeper issue with ESLint's module resolver configuration or how the `@handterm/types` package is being consumed, despite `ITerminalAdapter` being re-exported from `packages/types/src/index.ts`.
*   **Automated Test Failures:** Running `npm test` (Vitest unit tests) results in 4 failed suites:
    *   `src/components/HandTermWrapper.test.tsx`: "Failed to resolve entry for package "monaco-editor"."
    *   `src/components/MonacoCore.q.spec.tsx`: "TypeError: Unknown file extension ".css" for .../standalone-tokens.css"
    *   `src/hooks/useTerminal.test.ts` and `src/__tests__/hooks/useActivityMediator.test.ts`: "Error: Cannot find package 'preact' imported from .../@preact/signals/dist/signals.mjs"
    *   `src/components/MonacoCore.spec.tsx`: "AssertionError: expected "spy" to be called with arguments: \[ …(2) ]" (specifically for `initializes Vim mode`).
    *   Playwright E2E tests are currently paused due to persistent TypeScript transpilation issues (`SyntaxError: TypeScript enum is not supported in strip-only mode`).
*   **Browser Runtime Error: "Uncaught Error: InstantiationService has been disposed"**: *Resolved*.
*   **Browser Warning:** "Initial Sync: Signal (normal) differs from URL (tutorial). Synchronizing signal." This indicates a state synchronization issue, possibly related to how activities are managed. *Still present, not yet addressed.*
*   **New UI Issues:**
    *   Excessively verbose logging: Partially addressed in `Logger.ts`, but `createLogger` calls in components still need to be updated to `LogLevel.WARN`.
    *   Missing prompt in the terminal.
    *   "Gutter" of about 3 character widths on the left side.
    *   Slow typing performance.
    *   `Enter` key clears terminal but does not submit commands.

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
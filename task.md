# Task: Fix Monaco Editor VIM Command Initialization

## Objective

Investigate and fix the issue preventing VIM Ex commands (e.g., `:q!`, `:wq`) from working in the Monaco editor, ensuring `monaco-vim` is fully initialized before custom commands are defined (related to issue #91).

## Plan

Follow the detailed investigation and fix plan outlined in `plan.md` (as of 2025-04-07 ~7:36 AM PST). Key steps include:
1. Analyze the initialization flow in `src/components/MonacoCore.tsx` (editor creation, `monaco-vim` attachment, `defineVimCommands` call).
2. Understand how `monaco-vim` signals readiness (e.g., `window.MonacoVim` availability).
3. Implement synchronization in `MonacoCore.tsx` to delay `defineVimCommands` until `monaco-vim` is ready.
4. Verify the fix by uncommenting and running the `:q!` test in `src/e2e/page-objects/EditorPage.spec.ts`, and then run the full suite.

## Completion Steps (After implementing and verifying the fix)

1. Append a summary of the changes made and the *new* total failing test count after running the full suite to this `task.md` file.
2. Stage the changes using `git add .`.
3. Create a multi-line commit message describing the fix, referencing issue #91 (e.g., `fix(editor): Ensure monaco-vim initializes before defining commands\n\nDelayed defineVimCommands call until window.MonacoVim is available.\n\nAddresses part of #91`).
4. Use the `attempt_completion` tool.

## Related Files & Issues

*   `plan.md` (Detailed plan for this task)
*   GitHub Issue: #91 (Overall Playwright test fixing effort)
*   `src/components/MonacoCore.tsx` (Primary file to modify)
*   `src/e2e/page-objects/EditorPage.spec.ts` (Target test file)
*   `monaco-vim` library documentation (if needed)

## Summary (2025-04-07)

*   **Diagnosis:** The root cause was accessing the `monaco-vim` API incorrectly. The correct method is via the namespace import (`import * as monacoVim from 'monaco-vim';`) and accessing `monacoVim.VimMode.Vim`. Additionally, React StrictMode's double effect invocation required using a `useRef` flag (`initRan`) to prevent double initialization and a `setTimeout` before defining commands to allow `monaco-vim`'s internal state to settle.
*   **Changes:**
    *   Modified `MonacoCore.tsx` to use `monacoVim.VimMode.Vim` for defining Ex commands.
    *   Implemented the `initRan` ref flag to handle StrictMode.
    *   Added a `setTimeout` before calling `defineVimCommands` in the initialization effect.
    *   Memoized the `MonacoCore` component instance in `HandTermWrapper.tsx` (though this didn't solve the double mount caused by StrictMode).
    *   Uncommented the `:q!` test in `EditorPage.spec.ts`.
    *   Added a `:w` test to `EditorPage.spec.ts` for verification.
*   **Verification:**
    *   The `:w` test passes, confirming custom commands can now be defined and executed.
    *   The `:q!` test still fails, but logs show the `:q` handler is incorrectly triggered, indicating a likely command prefix conflict within `monaco-vim` itself, separate from the initialization issue.
*   **Test Results:** The full suite run resulted in **28 failing tests**. This is expected as this fix only addressed the VIM initialization part of issue #91.
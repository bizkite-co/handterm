---
title: Fix Editor Exit Command (:q!) and Double Prompt Issue
issue: 91
---

## Goal

Investigate and fix the issues preventing editor commands (specifically starting with `:q!`) from working correctly and resolve the reappearance of the double prompt (`> > `) after exiting the editor.

## Problem

Users report that editor commands like `:q!` are not functioning as expected. Furthermore, after attempting to exit the editor (presumably via such commands), the terminal displays a double prompt instead of a single one. This indicates problems with both the editor's command handling and the state transition logic back to the normal terminal mode.

## Investigation & Fix Plan

1.  **Analyze `:q!` Test (`EditorPage.spec.ts`):**
    *   [ ] Examine the `handles :q! command` test in `src/e2e/page-objects/EditorPage.spec.ts` (line ~85).
    *   [ ] Understand how it simulates the command input and what assertions it makes about the application state after exit (e.g., visibility of terminal prompt, absence of editor).
2.  **Analyze Editor Command Handling (`MonacoCore.tsx` / related):**
    *   [ ] Review the code responsible for capturing and processing colon (`:`) commands within the Monaco editor instance.
    *   [ ] Trace the logic for the `:q!` command. Is it correctly triggering an exit action?
3.  **Analyze Editor Exit Transition Logic:**
    *   [ ] Investigate the code that handles switching from the `EDIT` activity back to `NORMAL`. This likely involves:
        *   `navigationUtils.ts` (calling `navigate` to change URL state).
        *   State machines or hooks listening for activity changes (`useActivityMediator.ts`?).
        *   `useTerminal.ts` (logic to clear editor state and reset/display the terminal prompt).
    *   [ ] Identify why the prompt might be rendered twice during this transition.
4.  **Implement Fixes:**
    *   [ ] Correct the editor command handling logic to ensure `:q!` triggers the exit process reliably.
    *   [ ] Modify the exit transition and/or `useTerminal.ts` prompt logic to prevent the double prompt from appearing. Ensure the terminal state is cleanly reset.
5.  **Targeted Verification:**
    *   [ ] Run the `handles :q! command` test individually (`npx playwright test src/e2e/page-objects/EditorPage.spec.ts -g "handles :q! command"`) to confirm it passes.
    *   [ ] Manually verify or add assertions to the test to explicitly check for a *single* prompt after exit.

## Implementation & Verification

1.  **Implement Solution:** Apply code changes to editor command handling and exit transition logic.
2.  **Verify Fix:**
    *   [ ] Confirm the targeted `:q!` test passes, including the single prompt check.
    *   [ ] Run the full test suite (`npx playwright test`) to assess the overall impact, as fixing this transition might resolve other seemingly unrelated timeouts or errors. Document the new failure count.

## Next Steps (Post-Fix)

*   Commit the fix, referencing this subtask and the main issue (#91).
*   Report completion and the updated test failure count back to the Architect mode chat.
*   Analyze any remaining failures.

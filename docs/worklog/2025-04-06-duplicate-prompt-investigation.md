# Worklog: Investigate Duplicate Prompt Issue (2025-04-06)

## Task

Investigate and plan the fix for the duplicate prompt (`> > `) appearing after the `complete` command is executed.

## Problem Understanding

After executing the `complete` command within the Handterm TUI, the terminal prompt incorrectly displays two prompt symbols (`> > `) instead of the expected single prompt (`> `). This suggests an issue with how the terminal state is updated or rendered after command completion. This might be related to asynchronous operations, state management, or rendering logic within the terminal component or associated command handling.

## Initial Plan

- [x] Search codebase for tests related to the `complete` command, terminal interactions, and prompt rendering (both Playwright and Vitest).
- [x] Ask the user for the status of recent test runs, specifically focusing on failures related to terminal behavior or command completion.
- [x] Analyze identified tests and user feedback to pinpoint relevant test cases.
- [x] Develop a detailed investigation strategy based on findings (e.g., running specific tests, code analysis, command isolation).
- [x] Document the detailed strategy in this worklog.
- [ ] Present the detailed strategy to the user for approval.
- [ ] Request switch to an appropriate mode (Code/Debug) for execution.

## Detailed Investigation Plan (Revised)

1.  **Run Target Test:**
    - [ ] Execute the specific Playwright test file `src/e2e/page-objects/TerminalPage.spec.ts`.
    - [ ] Pay close attention to the result of the **`should maintain single prompt after page refresh`** test (lines ~178-220). This test involves completing tutorials, refreshing the page, and checking the prompt count.
    *   *Command Idea (for later execution):* `npx playwright test src/e2e/page-objects/TerminalPage.spec.ts`
2.  **Analyze Test Results:**
    - [ ] **If Failing:** Examine the Playwright report (trace, errors, screenshots) to understand how/when the duplicate prompt appears, especially after the page refresh and tutorial completion steps.
    - [ ] **If Passing:** Re-evaluate the test logic. Does it accurately reflect the manual scenario? Consider running other tests in the file (e.g., `should have prompt only`, `should have correct terminal content after completing tutorials`) or modifying the test to better capture the manual scenario.
3.  **Code Investigation (if needed):**
    - [ ] Based on test outcomes, investigate relevant code sections:
        *   `src/commands/completeCommand.ts` (or similar, as used in `completeTutorials`)
        *   `src/hooks/useTerminal.ts` (esp. prompt writing, `onSubmit`, initialization logic after refresh)
        *   `src/e2e/page-objects/TerminalPage.ts` (methods used in the test: `completeTutorials`, `waitForPrompt`)
        *   React Components: `HandTermWrapper.tsx`, `PromptHeader.tsx`.
        *   State persistence/rehydration logic (related to `localStorage` and signals like `completedTutorialsSignal`).
4.  **Isolation Strategy (Fallback):**
    - [ ] If direct analysis is inconclusive, duplicate or create a test based on **`should maintain single prompt after page refresh`**.
    - [ ] Simplify the setup (e.g., manually set `localStorage` instead of running `completeTutorials`) and page refresh steps.
    - [ ] Incrementally reintroduce logic until the double prompt reappears.
5.  **Document & Propose Fix:**
    - [ ] Update this worklog with findings.
    - [ ] Propose a specific fix strategy.

## Next Steps

- Present this revised plan to the user for approval.
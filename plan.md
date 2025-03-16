# Plan to Fix Failing Tests in `src/components/PromptHeader.test.tsx`

## Goal

Fix the failing tests in `src/components/PromptHeader.test.tsx`.

## Problem

The tests in `src/components/PromptHeader.test.tsx` are failing because they are using an incorrect CSS selector to find the prompt header element. The tests use `container.querySelectorAll(TerminalCssClasses.promptHeader)`, which is equivalent to `container.querySelectorAll('prompt-header')`. Since `prompt-header` is an ID, the correct selector should be `#prompt-header`.

## Approach

1.  **Update Selectors:** Modify the tests in `src/components/PromptHeader.test.tsx` to use the correct CSS selector for the prompt header element. Change `container.querySelectorAll(TerminalCssClasses.promptHeader)` to `container.querySelectorAll('#' + TerminalCssClasses.promptHeader)`.

## Steps

1.  Open `src/components/PromptHeader.test.tsx`.
2.  Replace `container.querySelectorAll(TerminalCssClasses.promptHeader)` with `container.querySelectorAll('#' + TerminalCssClasses.promptHeader)` in both tests.
3.  Run the tests to verify that the fix is effective.

## GitHub Issue and Subtask

*   **Parent Issue:** #79 (Fix Failing Vitest Tests)
*   **Subtask:** Fix failing tests in `src/components/PromptHeader.test.tsx`
The following test suites have failing tests:

*   `/home/mstouffer/repos/handterm-proj/handterm/src/components/HandTermWrapper.test.tsx` (5 failing tests)
*   `/home/mstouffer/repos/handterm-proj/handterm/src/components/MonacoCore.q.spec.tsx` (1 failing test)
*   `/home/mstouffer/repos/handterm-proj/handterm/src/components/PromptHeader.test.tsx` (2 failing tests)
*   `/home/mstouffer/repos/handterm-proj/handterm/src/hooks/useTerminal.test.ts` (1 failing test)
*   `/home/mstouffer/repos/handterm-proj/handterm/src/__tests__/commands/editCommand.test.ts` (2 failing tests)
*   `/home/mstouffer/repos/handterm-proj/handterm/src/__tests__/commands/editCommandActivity.test.ts` (1 failing test)
*   `/home/mstouffer/repos/handterm-proj/handterm/src/__tests__/utils/awsApiClient.test.ts` (1 failing test)

## Initial Prioritization

Based on a preliminary review of the error messages, the following tests seem like good candidates for initial prioritization due to their potentially simpler nature:

1.  **`src/components/PromptHeader.test.tsx`:** Assertion errors related to prompt count. This might be a straightforward fix related to how the prompt is rendered or updated.
2.  **`src/components/MonacoCore.q.spec.tsx`:** A `TypeError` related to `pathname` in `navigationUtils.ts`. This could be a simple fix related to how the navigation functions are called or how the URL is constructed.
3.  **`src/__tests__/commands/editCommand.test.ts`**: Assertion errors related to the `edit` command not being called.
4.  **`src/__tests__/commands/editCommandActivity.test.ts`**: Assertion errors related to the `edit` command not being called.
5.  **`src/hooks/useTerminal.test.ts`:** An assertion error related to the number of prompts. This might be related to how the prompt is handled during initialization or activity changes.

The remaining tests in `HandTermWrapper.test.tsx` appear to be related to finding elements by `[data-testid="xtermRef"]`, and may require a more in-depth investigation. The `awsApiClient.test.ts` failure is due to a missing mock, which should also be addressed.

## Next Steps

1. Create a GitHub issue for fixing the failing tests.
2. Create a subtask for the first prioritized test (`src/components/PromptHeader.test.tsx`).
3. Overwrite `plan.md` with a detailed plan for the first subtask.

# Revised Plan: XTerm to Monaco Migration - Phase 1 Completion

The primary goal remains to complete Phase 1: Abstraction & Preparation, by fixing the failing integration tests. However, the testing strategy will be modified to accommodate existing failures and avoid running the full test suite.

## Phase 1: Abstraction & Preparation (Completion)

1.  **Understand the Test Failures:**
    *   Investigate the specific failures in `HandTermWrapper.test.tsx` and `useActivityMediator.test.ts` as indicated in `docs/issues/92-make-the-xterm-into-a-monaco/phase-1-abstraction.md`. This will involve reading these test files and their corresponding implementation files (`HandTermWrapper.tsx` and `useActivityMediator.ts`).
    *   I will use `codebase_search` to find the relevant files and then `read_file` to examine their contents.
    *   **New Step:** Identify which of these failures are likely related to the recent refactoring to `ITerminalAdapter` and which might be pre-existing issues.

2.  **Reproduce and Debug Relevant Test Failures:**
    *   **Modified Step:** Instead of running the full suite, I will run *only* the specific failing unit or integration tests identified as relevant to our changes. This will help observe the exact errors and stack traces for the issues we are addressing.
    *   Analyze the test output to pinpoint the root cause of the regressions introduced by our changes.
    *   **New Step:** Investigate the "Oops! Something went wrong." error when transitioning to "GameMode" during manual testing. This might be related to the `useActivityMediator` or `ITerminalAdapter` changes.

3.  **Implement Fixes:**
    *   Based on the debugging, modify `HandTermWrapper.tsx`, `useActivityMediator.ts`, or related files to resolve the issues introduced during the refactoring to `ITerminalAdapter`.
    *   I will adhere to the coding standards outlined in `CONVENTIONS.md` and `./.eslintrc.cjs`. Specifically, I will ensure spaces are used instead of tabs, `logging` is preferred over `print`, and file sizes are kept around 100 lines by parsing functions out to other files if necessary.

4.  **Verify Fixes with Individual Tests and Manual Testing:**
    *   **Modified Step:** Run *only* the specific unit tests (`HandTermWrapper.test.tsx`, `useActivityMediator.test.ts`) that were modified or are directly related to the fixes.
    *   **New Step:** Perform manual testing on the live dev site, specifically focusing on the terminal functionality and the "GameMode" transition, to ensure the fixes are effective and no new regressions are introduced in the areas we are touching.

5.  **Update Documentation:**
    *   Once the relevant tests pass and manual verification confirms the fixes, I will update the `docs/issues/92-make-the-xterm-into-a-monaco/phase-1-abstraction.md` file to mark the remaining task as completed.

## Subsequent Phases (High-Level Overview for Context)

*   **Phase 2: Monaco Implementation:** Create a new hook and component to implement the `ITerminalAdapter` interface using the Monaco Editor.
*   **Phase 3: The Swap:** Swap the XTerm implementation with Monaco using a feature flag.
*   **Phase 4: `Effect` State Machine & Cleanup:** Refactor state management with the `Effect` library and remove legacy XTerm code.

## Mermaid Diagram for Revised Phase 1 Completion

```mermaid
graph TD
    A[Start Phase 1 Completion] --> B{Identify Failing Tests & Their Relevance};
    B --> C[Read HandTermWrapper.test.tsx, useActivityMediator.test.ts];
    C --> D[Read HandTermWrapper.tsx, useActivityMediator.ts];
    D --> E[Run Specific Vitest Tests to Reproduce Failures];
    E --> F{Analyze Errors & Debug};
    F --> G[Implement Code Fixes];
    G --> H[Run Specific Unit Tests];
    H{Specific Unit Tests Pass?} -- No --> F;
    H -- Yes --> I[Perform Manual Testing (Terminal & GameMode)];
    I{Manual Testing OK?} -- No --> F;
    I -- Yes --> J[Update phase-1-abstraction.md];
    J --> K[End Phase 1 Completion];
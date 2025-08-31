# Revised Plan: XTerm to Monaco Migration - Phase 1 Completion

The primary goal remains to complete Phase 1: Abstraction & Preparation, by fixing the failing integration tests and the "GameMode" error.

## Current Status

Phase 1: Abstraction & Preparation is now **Completed**. We have successfully addressed several TypeScript errors that arose during the initial refactoring and debugging, and the "GameMode" error has been resolved.

*   **`GamePhrases` Reference Error:** Resolved by correcting the import and usage of `GamePhrases` in `src/components/NextCharsDisplay.tsx`.
*   **`safelyCallMethodOnRef` Type Errors:** Resolved by directly accessing `timerRef.current` methods with runtime checks in `src/components/NextCharsDisplay.tsx`, bypassing the `safelyCallMethodOnRef` utility for now due to persistent type inference issues.
*   **`ActionType` Export Error:** Resolved by explicitly re-exporting `ActionType` from `src/game/types/ActionTypes.ts`.
*   **`JSX.Element` Error:** Resolved by explicitly importing `React` and using `React.JSX.Element` in `src/game/Game.tsx`.
*   **`useTerminal` and `HandTermWrapper` Refactoring:**
    *   `useTerminal` in `src/hooks/useTerminal.ts` now correctly accepts a nullable `RefObject<HTMLDivElement | null>`.
    *   `HandTermWrapper` in `src/components/HandTermWrapper.tsx` explicitly types the `terminal` variable as `ITerminalAdapter`.
    *   The `useTerminal` mock in `src/components/HandTermWrapper.test.tsx` has been updated to reflect the `ITerminalAdapter` interface.
*   **`TerminalCssClasses` Import Error:** Resolved by correcting the import path in `src/components/NextCharsDisplay.tsx`.

The immediate TypeScript errors have been cleared, and the "GameMode" error has been resolved.

## Phase 1: Abstraction & Preparation (Completion)

This phase is now complete. The following tasks were part of its completion:

1.  **Understand the Test Failures & "GameMode" Error:**
    *   Investigated the specific failures in `HandTermWrapper.test.tsx` and `useActivityMediator.test.ts`.
    *   Debugged the "Oops! Something went wrong." error when transitioning to "GameMode" during manual testing. Logging was added to `src/game/Game.tsx` and `src/signals/gameSignals.ts` to aid this.
    *   Identified which failures were related to the `ITerminalAdapter` refactoring and which were pre-existing.

2.  **Reproduce and Debug Relevant Test Failures:**
    *   Ran *only* the specific failing unit or integration tests identified as relevant to our changes.
    *   Analyzed the test output and console logs to pinpoint the root cause of the regressions and the "GameMode" error.

3.  **Implement Fixes:**
    *   Based on debugging, modified `HandTermWrapper.tsx`, `useActivityMediator.ts`, `Game.tsx`, `gameSignals.ts`, or related files to resolve the issues.
    *   Adhered to coding standards outlined in `CONVENTIONS.md` and `./.eslintrc.cjs`.

4.  **Verify Fixes with Individual Tests and Manual Testing:**
    *   Ran *only* the specific unit tests that were modified or are directly related to the fixes.
    *   Performed manual testing on the live dev site, specifically focusing on the terminal functionality and the "GameMode" transition.

5.  **Update Documentation:**
    *   Updated `docs/issues/92-make-the-xterm-into-a-monaco/phase-1-abstraction.md` to mark the remaining task as completed.

## Mermaid Diagram for Revised Phase 1 Completion

```mermaid
graph TD
    A[Start Phase 1 Completion] --> B{Identify Failing Tests & "GameMode" Error};
    B --> C[Review HandTermWrapper.tsx, useActivityMediator.ts, Game.tsx, gameSignals.ts];
    C --> D[Add Logging to Game.tsx (Done)];
    D --> E[Run Specific Vitest Tests & Manual Testing];
    E --> F{Analyze Logs & Debug};
    F --> G[Implement Code Fixes];
    G --> H[Run Specific Unit Tests];
    H{Specific Unit Tests Pass?} -- No --> F;
    H -- Yes --> I[Perform Manual Testing (Terminal & GameMode)];
    I{Manual Testing OK?} -- No --> F;
    I -- Yes --> J[Update phase-1-abstraction.md];
    J --> K[End Phase 1 Completion];
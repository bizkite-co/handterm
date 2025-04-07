---
title: Resolve Playwright Failures Due to Command Registration Timing
issue: 91
---

## Goal

Investigate and resolve Playwright test failures (primarily timeouts and command-not-found errors) caused by tests attempting to execute commands before they are fully registered by the application's dynamic loading mechanism (`import.meta.glob` in `src/commands/index.ts`).

## Problem

Despite refining Playwright wait logic, tests like those in `src/e2e/edit-command.spec.ts` continue to fail. The suspected root cause is a timing issue: tests execute commands (e.g., `edit`) before the asynchronous `import.meta.glob` process in `src/commands/index.ts` has completed, meaning the command isn't yet registered within the application instance being tested.

## Investigation & Solution Plan

1.  **Analyze Command Registration (`src/commands/index.ts`):**
    *   [ ] Understand the timing and asynchronous nature of `import.meta.glob`. How and when does it populate the command registry?
    *   [ ] Is there any event or state change that signals when registration is complete?
2.  **Analyze Test Execution Flow (`edit-command.spec.ts`, etc.):**
    *   [ ] Review `beforeEach` hooks and test steps. How soon after page load do tests attempt to execute commands?
3.  **Explore Solutions for Test Environment Synchronization:**
    *   [ ] **Explicit Wait:** Can tests reliably wait for command registration?
        *   *Idea:* Add a mechanism (e.g., a `window` flag, a custom event, a specific console log) in the application code (`src/commands/index.ts` or related init logic) that signals when commands are ready. Tests would then wait for this signal before proceeding.
    *   [ ] **Configuration:** Research Vite/Playwright options related to `import.meta.glob` handling in test environments. Can eager loading be forced?
    *   [ ] **Test Setup Modification:** Can the test setup somehow ensure command registration completes before test logic runs? (e.g., adding delays - less ideal, triggering registration manually if possible).
4.  **Implement Preferred Solution:**
    *   [ ] Choose the most robust and maintainable solution (likely an explicit wait mechanism).
    *   [ ] Implement the necessary changes in both application code (to signal readiness) and test code (to wait for the signal).
5.  **Targeted Verification:**
    *   [ ] Focus on `src/e2e/edit-command.spec.ts`.
    *   [ ] Run these tests individually after implementing the solution to confirm the command registration issue is resolved.

## Implementation & Verification

1.  **Implement Solution:** Apply code changes to the application and/or test setup.
2.  **Verify Fix:**
    *   [ ] Confirm the targeted tests in `edit-command.spec.ts` pass consistently.
    *   [ ] Run the full test suite (`npx playwright test`) to assess the overall impact on the remaining failing tests. Document the new failure count.

## Next Steps (Post-Fix)

*   Commit the fix, referencing this subtask and the main issue (#91).
*   Report completion and the updated test failure count back to the Architect mode chat.
*   Analyze any remaining failures.

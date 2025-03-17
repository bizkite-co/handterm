---
title: Fix failing Playwright tests
issue: 88
---

## Goal

Fix all failing Playwright tests.

## Problem

Several Playwright tests are failing, indicating bugs or regressions in the codebase.

## Approach

1.  **Run Playwright Tests:** Execute the Playwright test suite to gather a list of failing tests and their error messages. This can be done using the command `npx playwright test`.
2.  **Gather Results:** Collect the output from the Playwright test run. This output will typically include the names of failing tests, file paths, and error messages.  We can potentially use a JSON reporter to make this easier.
3.  **Analyze Failing Tests:** Examine the output to understand the nature of each failing test.
4.  **Prioritize Tests:** Prioritize the failing tests based on estimated ease of fixing. Simpler errors should be addressed first.
5.  **Create GitHub Issue:** Create a GitHub issue to track the overall progress of fixing the failing Playwright tests.
6.  **Create Subtasks (and Sub-Chats):** For each failing test (or a group of related failing tests):
    *   Create a subtask under the main GitHub issue.
    *   Overwrite `plan.md` with a detailed plan for fixing that specific test.
    *   The Architect (me) will then request to switch to Code mode, providing a reason for the switch.
    *   Once in Code mode, a new task (sub-chat) will be created using the `new_task` tool, with the initial message describing the specific test to be fixed and referencing the plan and GitHub issue.
    *   The Code mode instance will then work on fixing the test, following the plan.
7.  **Fix Tests Iteratively:**
    *   Address the failing tests one by one, following the plan outlined in each subtask (within its dedicated Code mode chat).
    *   Run the tests frequently to ensure that the fixes are effective and do not introduce new issues.
    *   Commit each fix with a clear commit message referencing the subtask number.
8.  **Create Pull Request:** Once all failing tests are fixed, create a pull request to merge the changes into the main branch.

## Notes on Workflow

This plan utilizes a workflow where the Architect mode creates overall plans and prioritizes tasks. For each failing test (or group of related tests), the following process is used:

1.  The Architect creates a detailed plan in `plan.md`.
2.  The User creates a GitHub issue from this plan.
3.  The Architect requests to switch to Code mode.
4.  A new task (sub-chat) is created in Code mode using the `new_task` tool, with the initial message referencing the plan and the GitHub issue.
5.  The Code mode instance then works on implementing the fix.

This approach allows for focused work on individual tests within separate Code mode contexts, while maintaining an overall architectural overview in the Architect mode.

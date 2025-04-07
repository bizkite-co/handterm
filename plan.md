---
title: Fix Editor Exit and Terminal Display Issues
issue: 91
---

## Goal

Resolve issues with the Monaco editor exit process and terminal display:
1. ✅ Fix editor height issue (now displays properly)
2. ✅ Fix VIM command execution (`:q!` now executes)
3. ✅ Fix terminal display after editor exit (implemented changes to HandTermWrapper.tsx)
4. ✅ Verify localStorage behavior (`:q!` correctly removes content from localStorage)

## Problem

While the editor now displays properly and the VIM commands execute, there were issues with the transition back to the terminal:

1. After executing `:q!`, the editor closed and content was removed from localStorage (expected), but the terminal was not displayed. Only the Output section was visible.

2. When trying to edit the file again after exiting, the content was blank, which is expected for `:q!` (discard changes and exit), but we should verify that `:wq` correctly saves changes.

## Implemented Fixes

### Terminal Display Issue:

1. **HandTermWrapper.tsx Changes:**
   - ✅ Simplified terminal initialization logic to only check for NORMAL activity
   - ✅ Added detailed logging for terminal state transitions
   - ✅ Ensured terminal visibility and focus during NORMAL activity
   - ✅ Resolved TypeScript error related to invalid activity type

2. **Specific Improvements:**
   - ✅ Terminal will now be displayed and initialized only during NORMAL activity
   - ✅ Added detailed logging to track terminal initialization process
   - ✅ Preserved existing error handling and logging mechanisms
   - ✅ Simplified the terminal visibility condition

## Verification Plan

1. **Manual Testing:**
   - Test the editor exit process with both `:q!` and `:wq` commands
   - Verify the terminal is properly displayed after exiting
   - Verify file content behavior is correct for both commands

2. **Automated Testing:**
   - Run e2e tests to verify terminal behavior after editor exit
   - Monitor logs to confirm proper state transitions
   - Test with both `:q!` and `:wq` commands to validate terminal display

## Next Steps

1. **Verify Fixes:**
   - Run the specific tests for `:q!` and `:wq` commands:
     ```bash
     npx playwright test src/e2e/page-objects/EditorPage.spec.ts -g "handles :q! command"
     npx playwright test src/e2e/page-objects/EditorPage.spec.ts -g "handles :wq command"
     ```
   - Run the full test suite to check for regressions:
     ```bash
     npx playwright test
     ```

2. **Documentation:**
   - Update documentation to reflect the changes made
   - Document the editor component's behavior and dependencies

3. **Final Review:**
   - Review the code changes for any potential issues
   - Ensure all tests pass
   - Commit the changes with a descriptive message referencing issue #91

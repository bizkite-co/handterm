# Editor Exit and Terminal Display Fix

## Task

Fix issues with the Monaco editor exit process and terminal display after executing VIM commands.

## Problem Description

We identified several issues with the Monaco editor component:

1. **Editor Height Issue**: The editor was collapsing to 0px height except for the status bar.
2. **VIM Command Execution**: Commands like `:q!` and `:wq` weren't working properly.
3. **Terminal Display After Exit**: After executing `:q!`, the editor closed but the terminal wasn't displayed.
4. **Output Section Visibility**: The Output section remained visible when it shouldn't.

## Investigation

### Editor Height Issue

The editor container in `MonacoCore.tsx` had a style with `height: 'auto'`, which wasn't sufficient to ensure proper sizing. The parent container in `HandTermWrapper.tsx` didn't provide explicit height constraints for the editor.

### VIM Command Execution

The VIM commands were defined correctly in `MonacoCore.tsx`, but there were timing issues with the VIM API initialization. The commands were being defined before the VIM API was fully initialized.

### Terminal Display After Exit

After executing `:q!`, the editor closed and content was removed from localStorage (expected), but the terminal wasn't displayed. Only the Output section was visible. This was due to issues with the conditional rendering logic in `HandTermWrapper.tsx` and terminal initialization after activity transition.

## Implemented Fixes

### Editor Height Fix

1. Updated container style in `MonacoCore.tsx` to use `height: '100%'` instead of 'auto'
2. Added `minHeight: '300px'` to prevent collapse
3. Added `flex: '1 1 auto'` to the parent container

### Double Prompt Fix

1. Removed redundant `resetPrompt()` call in `HandTermWrapper.tsx`'s `handlePhraseComplete` function
2. Ensured `resetPrompt()` is called once in `handlePhraseSuccess`

### VIM Command Initialization Fix

1. Increased initialization delay to 500ms in `MonacoCore.tsx`
2. Ensured proper checks for `window.MonacoVim` availability

### Terminal Display Fix

1. Simplified terminal initialization logic in `HandTermWrapper.tsx` to only check for NORMAL activity
2. Added detailed logging for terminal state transitions
3. Ensured terminal visibility and focus during NORMAL activity
4. Resolved TypeScript error related to invalid activity type

## Verification

### Manual Testing

1. Verified the editor displays at full height (not collapsed)
2. Verified `:q!` command executes and closes the editor
3. Verified the terminal is properly displayed after exiting
4. Verified content is correctly removed from localStorage after `:q!` (expected behavior)

### Automated Testing

1. Ran specific tests for `:q!` and `:wq` commands
2. Monitored logs to confirm proper state transitions

## Next Steps

1. Run the full test suite to check for regressions
2. Update documentation to reflect the changes made
3. Commit the changes with a descriptive message referencing issue #91

## Related Files

- `src/components/MonacoCore.tsx` - Editor component with VIM integration
- `src/components/HandTermWrapper.tsx` - Terminal rendering logic
- `src/hooks/useTerminal.ts` - Terminal state management
- `src/hooks/useActivityMediator.ts` - Activity state management
- `src/utils/navigationUtils.ts` - Navigation and activity transition
- `src/e2e/page-objects/EditorPage.spec.ts` - Editor tests
# Monaco Editor Content Display Investigation

## Task
Investigating why content from editCommand.tsx is not displaying in the Monaco editor TUI despite being properly fetched and stored in localStorage.

## Current Status
- Unit tests for editCommand.tsx pass
- E2E tests for content display and vim functionality fail
- Content is confirmed to be fetched and stored in localStorage correctly

## Investigation Plan
1. Examine failing e2e tests to understand expected behavior
2. Review editCommand.tsx implementation
3. Check Monaco editor configuration and content loading
4. Identify potential disconnects between content storage and display

## Findings
- E2E tests confirm content is set in localStorage and activity changes to 'edit'.
- editCommand.tsx fetches content, sets activity, and stores content in localStorage.
- The issue likely lies in how the Monaco editor component retrieves and displays the content.
- MonacoCore.tsx is responsible for rendering the editor and receives a 'value' prop.
- The 'value' prop is likely not being updated correctly when the 'edit' command is executed.
- HandTermWrapper.tsx uses getStoredContent() to retrieve content from localStorage.
- The e2e test was setting 'edit-content' in localStorage *before* executing the 'edit' command, causing the initial issue.
- Tests are still failing; completing the tutorial is a prerequisite for entering 'edit' mode.
- StorageKeys has been moved to @handterm/types.

## Next Steps
1. Run the tests to confirm the current state.
2. If tests still fail, investigate further.
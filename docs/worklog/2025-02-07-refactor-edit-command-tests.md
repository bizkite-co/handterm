# Refactor Edit Command Tests

## Current State
The current edit command test implementation in `src/e2e/edit-command.spec.ts` combines multiple concerns:
1. Writing to localStorage
2. Reading from localStorage
3. Terminal command execution
4. Navigation to edit activity
5. Monaco editor interaction

## Reference Implementation
The `localStorage-presence.spec.ts` test demonstrates good separation of concerns by:
- Testing localStorage operations in isolation
- Breaking down tests into smallest possible units
- Using clear, focused test cases

## Task Understanding
We need to refactor the edit command tests to:
1. Focus on testing that text can be read from localStorage and displayed in the terminal UI
2. Test that we can type text into the terminal and save it
3. Use the TerminalPage page object for UI interactions

## Plan

### 1. Create Basic localStorage Tests
Create a new test file `src/e2e/tests/edit-content-storage.spec.ts` that will:
- Test storing edit content in localStorage
- Test retrieving edit content from localStorage
- Focus purely on data persistence, no UI interaction

### 2. Create Terminal Display Tests
Create a new test file `src/e2e/tests/edit-content-display.spec.ts` that will:
- Test that content from localStorage appears in terminal
- Use TerminalPage object for terminal interactions
- Focus on UI display, assuming localStorage works

### 3. Create Terminal Input Tests
Create a new test file `src/e2e/tests/edit-content-input.spec.ts` that will:
- Test typing content into terminal
- Test saving typed content to localStorage
- Focus on input handling and storage

### 4. Update Original Test
Modify `src/e2e/edit-command.spec.ts` to:
- Focus on command execution and navigation
- Remove direct localStorage manipulation
- Use new focused test files as building blocks

## Next Steps
1. Create edit-content-storage.spec.ts to establish basic localStorage functionality
2. Create edit-content-display.spec.ts to test terminal display
3. Create edit-content-input.spec.ts to test terminal input
4. Update edit-command.spec.ts to use new components
5. Verify all feature file scenarios are covered

## Implementation Notes
- Use TerminalPage methods for all terminal interactions
- Follow localStorage-presence.spec.ts patterns for storage tests
- Keep tests focused on single responsibilities
- Ensure proper cleanup between tests
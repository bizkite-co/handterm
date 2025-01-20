# Activity Mediator Refactor Plan

## Problem
The useActivityMediator hook is too complex and has failing tests. The main issues are:

1. Duplicate localStorage checks for tutorial completion
2. Complex state transitions between activities
3. Tight coupling between tutorial and game logic
4. Multiple useEffect hooks managing different aspects of state

## Proposed Solution
1. Extract localStorage tutorial state management into a separate hook
2. Simplify activity state transitions
3. Separate tutorial and game logic
4. Consolidate useEffect hooks

## Implementation Steps

### Step 1: Create useTutorialState hook
- Move localStorage tutorial state management
- Handle completed-tutorials check
- Manage bypassTutorialSignal

### Step 2: Refactor useActivityMediator
- Use new useTutorialState hook
- Simplify activity state transitions
- Remove duplicate localStorage checks
- Consolidate useEffect hooks

### Step 3: Update Tests
- Update tests to use new structure
- Add additional test cases
- Verify all scenarios work correctly

## Next Steps
1. Implement useTutorialState hook
2. Refactor useActivityMediator to use new hook
3. Update tests

# Tutorial Activity Transition Analysis

## Current State
- `useActivityMediator.decideActivityChange()` contains legacy logic for handling tutorial/game transitions
- `getNextTutorial()` only returns tutorial items, making some logic redundant
- Tutorial and game phrases are now combined in a single ordered list

## Issues Identified
1. Unnecessary complexity in activity transition logic
2. Redundant checks since `getNextTutorial()` only returns tutorials
3. Potential for incorrect activity state transitions

## Proposed Solution
1. Simplify activity management by:
   - Removing `decideActivityChange()` function
   - Moving tutorial/game progression logic to `useTutorials.ts`
   - Handling returning users in the tutorial list query

2. Update activity transitions to:
   - Progress through combined tutorial/game list in order
   - Handle returning users by checking completion status
   - Maintain proper activity state without redundant checks

## Next Steps
1. Analyze and document current tutorial list management
2. Plan migration of activity transition logic to `useTutorials.ts`
3. Implement simplified activity state management
4. Update related components and hooks
5. Add tests for new progression behavior

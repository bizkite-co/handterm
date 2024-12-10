# Tutorial Progression Testing

## Current Status
- [ ] Initial tutorial state setup
- [ ] Enter key handling in terminal
- [ ] Tutorial state updates
- [ ] Activity state transitions
- [ ] Location updates

## Investigation Areas

### Tutorial Sequence (from feature file)
1. Start in tutorial mode
2. Type "Enter" -> expect 'fdsa'
3. Type "fdsa" -> expect 'jkl;'
4. Type "jkl;" -> expect game mode

### Terminal Input
- Monitoring Enter key handling (\r vs \r\n)
- Checking character codes for input
- Verifying command processing
- Ensuring proper command sequence

### Tutorial State
- Initial state setup with '\r' tutorial
- State transitions after commands
- Tutorial completion tracking
- Proper sequence progression

### Debug Points
1. Terminal Input (src/test-utils/setup.ts)
   - Before triggering input
   - After receiving input
   - Command processing
   - Character code verification

2. Tutorial State (src/hooks/useTutorials.ts)
   - Tutorial phrase comparison
   - State updates
   - Completion tracking
   - Sequence verification

3. Activity State (src/hooks/useActivityMediator.ts)
   - State transitions
   - Location updates
   - Game mode transition
   - Tutorial group handling

## Test Flow (Updated)
1. Initial state: Tutorial mode with '\r' tutorial
2. Enter key -> expect 'fdsa' tutorial
3. Type 'fdsa' -> expect 'jkl;' tutorial
4. Type 'jkl;' -> expect game mode transition

## Key Files
- src/e2e/scenarios/tutorialProgression.feature (defines expected behavior)
- src/e2e/__tests__/tutorialProgression.test.tsx (implements test)
- src/test-utils/setup.ts (terminal mocking)
- src/hooks/useTutorials.ts (tutorial state management)
- src/hooks/useActivityMediator.ts (activity transitions)
- src/hooks/useCommand.ts (command processing)

## Debug Strategy
1. Set breakpoints at key transitions
2. Monitor terminal input/output with character codes
3. Track tutorial state changes against expected sequence
4. Verify location updates match activity changes

## Current Issues
- Tutorial state not updating after Enter key
- Need to verify command processing
- Need to check tutorial completion logic
- Test had extra fdsa step not in feature file

## Next Steps
1. Debug terminal input handling (focus on Enter key)
2. Verify tutorial state updates match feature file
3. Check activity transitions follow sequence
4. Test location updates reflect state changes
5. Ensure test matches feature file exactly

## Notes
- Feature file defines simpler sequence than original test
- Need to focus on exact sequence: Enter -> fdsa -> jkl; -> game
- Terminal handling of Enter key (\r) is critical
- Tutorial state must follow precise progression

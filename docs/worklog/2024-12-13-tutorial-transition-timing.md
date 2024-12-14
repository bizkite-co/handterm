# Tutorial Transition Timing Investigation

- [x] Review tutorial.spec.ts test file
- [x] Analyze useActivityMediator.ts implementation
- [x] Investigate potential timing issues with currentTutorial ref
- [x] Implement fix for tutorial transition timing
  - Replaced useRef currentTutorial with computed signal currentTutorialSignal
  - Made navigation functions async to properly wait for completion
  - Added event listener handling for navigation state changes
  - Updated TerminalPage to wait for activity transitions
  - Added proper signal dependencies to ensure timely updates
- [ ] Verify test passes after changes

The issue was more complex than initially thought:
1. The useRef currentTutorial wasn't triggering re-renders when its value changed
2. Activity changes weren't properly waiting for navigation to complete
3. Navigation events weren't being properly handled in the test environment
4. The test page object wasn't waiting for activity transitions to complete

By using computed signals, making navigation operations async, properly handling navigation events, and ensuring the test page object waits for transitions to complete, we should now see proper transitions between tutorial and game modes with the game component rendering correctly.

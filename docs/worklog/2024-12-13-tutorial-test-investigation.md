# Tutorial Test Investigation

- [x] Analyze tutorial.spec.ts test failure
  - Test was failing due to not properly waiting for navigation events after tutorial transitions
- [x] Identify root cause of test failure
  - The "jkl;" tutorial completion triggers navigation to game mode via URL changes
  - Test was checking for game mode visibility before navigation completed
- [x] Implement fix for failing test
  - Added waitForURL checks to ensure navigation completes
  - Added explicit visibility/non-visibility checks for both modes
  - Added proper waiting for navigation back to tutorial mode
- [ ] Verify test passes after fix

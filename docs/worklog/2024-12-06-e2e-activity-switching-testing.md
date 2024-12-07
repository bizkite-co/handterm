# E2E Testing Strategy for TUI Activity Switching

## Date: 2024-12-06

### Context
After reviewing the initial testing approach, we identified the need to focus on the core interaction complexities of the Text-Based User Interface (TUI), specifically the activity switching mechanism.

### Testing Objectives
1. Validate Activity Mode Transitions
   - Ensure smooth switching between NORMAL, TUTORIAL, GAME modes
   - Verify computed signal states during transitions
   - Test edge cases and typical user workflows

2. Signal State Management
   - Confirm `isInTutorialModeSignal` and `isInGameModeSignal` accuracy
   - Test computed signal behavior during mode changes
   - Validate state consistency across different activities

### Implementation Approach
- Utilized Vitest for test framework
- Created a custom E2E test runner supporting descriptive test scenarios
- Implemented type-safe test step definitions
- Focused on precise state verification

### Key Test Scenarios
1. Individual Mode Entry
   - Verify entering TUTORIAL mode
   - Confirm entering GAME mode
   - Check NORMAL mode state

2. Complex Activity Switching
   - Test transitions between multiple modes
   - Validate computed signal states during switches
   - Ensure clean state management

### Technical Highlights
- Used `@preact/signals-react` computed signals
- Implemented flexible, readable test structure
- Maintained strong type safety
- Focused on behavioral testing over implementation details

### Future Improvements
- Expand test coverage for EDIT mode
- Add more complex activity transition scenarios
- Potentially integrate with actual TUI command interactions

### Lessons Learned
- Activity switching is a critical aspect of the TUI
- Computed signals provide a clean way to track mode states
- Descriptive, step-by-step testing improves test readability and maintainability

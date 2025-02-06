# Signal Architecture Refactor Plan

## Context
Currently, our signal architecture has several issues:
1. Signal creation is duplicated between app and tests
2. Types are split between src/types and packages/types
3. exposeSignals.ts recreates functionality that exists in the app
4. Test environment has to manually sync with localStorage

## Goals
1. Single source of truth for signal creation
2. Consistent type definitions
3. Simplified test setup
4. Better type safety across contexts

## Implementation Plan

### Phase 1: Move Signal Types to Package
* [x] Create signal types in @handterm/types
  * [x] Move TutorialSignals interface
  * [x] Move ActivityState interface
  * [x] Add SignalFactory types
* [x] Update imports in application code
* [x] Update imports in test code

### Phase 2: Create Signal Factories
* [ ] Create factory functions in @handterm/types
  * [ ] createTutorialSignals()
  * [ ] createActivitySignals()
  * [x] Use existing createPersistentSignal from utils
* [ ] Add proper type exports
* [x] Add localStorage synchronization in factories

### Phase 3: Update Application Code
* [ ] Update tutorialSignals.ts to use factories
* [ ] Update appSignals.ts to use factories
* [ ] Remove duplicate signal creation code
* [x] Update type imports

### Phase 4: Update Test Environment
* [ ] Modify exposeSignals.ts to use same patterns as app
  * [x] Use createPersistentSignal for test signals
  * [x] Add updateCompletedTutorials to window
  * [x] Add Phrases to window
  * [ ] Add proper error handling for signal updates
* [ ] Update e2e tests
  * [x] Remove manual localStorage manipulation
  * [x] Use signal functions to set test state
  * [ ] Add helper functions for common test states
  * [ ] Add state verification utilities

### Phase 5: Cleanup and Documentation
* [ ] Remove old type definitions
* [x] Update WindowExtensions interface
* [ ] Add documentation for signal factories
* [x] Document test state management
* [ ] Add examples for common test patterns

### Phase 6: Testing and Validation
* [ ] Add tests for signal factories
* [ ] Verify localStorage synchronization
* [ ] Test error handling
* [ ] Measure test performance impact

## Benefits
1. Single source of truth for signal creation
2. Consistent behavior between app and tests
3. Better type safety
4. Simplified test setup
5. Easier maintenance

## Migration Strategy
1. Create new files alongside existing ones
2. Gradually migrate components to new system
3. Run tests in parallel with both systems
4. Remove old system once migration is complete

## Risks and Mitigations
1. Risk: Breaking existing tests
   - Mitigation: Run old and new systems in parallel
2. Risk: Type incompatibilities
   - Mitigation: Comprehensive type testing
3. Risk: localStorage synchronization issues
   - Mitigation: Add synchronization tests

## Next Steps
1. Create initial types in @handterm/types
2. Create first factory function
3. Update one component as proof of concept
4. Review and adjust approach based on findings
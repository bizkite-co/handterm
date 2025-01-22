# Shared Types Package Implementation Plan

NOTE: Never remove a checkbox. If you find a checkbox we no longer need, mark it complete and add a comment explaining why.

## Phase 1: Create Package Structure
- [x] Create directory: `packages/types`
- [x] Create subdirectories:
  - [x] `packages/types/src`
  - [x] `packages/types/test`
- [x] Create initial files:
  - [x] `packages/types/src/index.ts`
  - [x] `packages/types/src/signal.ts`
  - [x] `packages/types/src/activity.ts`
  - [x] `packages/types/src/window.ts`

## Phase 2: Configure Package
- [x] Create `package.json` with:
  - [x] Proper package name (`@handterm/types`)
  - [x] Correct dependencies
  - [x] Build scripts
- [x] Create `tsconfig.json` with:
  - [x] Proper type checking configuration
  - [x] Build settings
- [x] Set up build scripts

## Phase 3: Define Initial Types
- [x] Implement Signal interface:
  - [x] Core properties
  - [x] Type guards
  - [x] Validation
- [x] Define ActivityType enum
- [x] Create Window extensions
- [x] Add type documentation

## Phase 4: Migration Plan
- [x] Update production code to use shared types
- [x] Update tests to use shared types
- [x] Remove duplicate type definitions
- [ ] Verify no regressions
  - [ ] Add integration tests
  - [ ] Run full test suite
  - [x] Add DOM parent chain validation steps (playwright.setup.ts:62-64)
  - [x] Implement initialization sequence checks (HandTermWrapper.tsx:338)
  - [ ] Document element dependency chain
- [x] Update exposeSignals.ts to match Signal interface
- [x] Implement proper error handling in executeCommand
- [x] Fix type safety issues in tutorial signals
- [x] Add type validation for all signal implementations

## Phase 5: Module Resolution and Test Environment
- [x] Fix module resolution in tests
  - [x] Identify all test files using 'src/types/Types' (No files found using this import path)
  - [ ] Update imports to use @handterm/types
  - [ ] Or create proper re-exports from old location
- [x] Verify test environment setup (Resolved terminal initialization timing issues)
  - [x] Check module resolution configuration (Proper paths configured in tsconfig.json)
  - [x] Ensure proper TypeScript paths (@handterm/types path correctly mapped)
  - [x] Validate test runner configuration (Playwright and Vitest configs properly set up)
- [x] Establish migration validation
  - [x] Add tests to verify type exports (Added signal.test.ts)
  - [x] Create type compatibility tests (Included in signal.test.ts)
  - [x] Add regression tests for module imports (Verified in signal.test.ts)

## Phase 6: Type System Cleanup
- [x] Fix duplicate property declarations in activitySignal
  - [x] Create separate interface for window extensions (Updated WindowExtensions in window.ts)
  - [x] Make executeCommand optional in window interface (Added ? to property)
  - [x] Ensure consistent property types across declarations (Added ActivityType)
  - [x] Add proper window existence checks (Added isWindowDefined helper)
- [ ] Make executeCommand declaration consistent
- [x] Properly handle symbol type casting
  - [x] Simplify Signal interface to use basic symbol type (Changed to use symbol instead of unique symbol)
  - [x] Remove custom brand types and use CoreSignal's brand (Using Omit<CoreSignal<T>, 'brand'>)
  - [x] Create helper function for symbol creation (Using Symbol.for consistently)
  - [x] Update all signal implementations to use consistent brand handling (Standardized in createSignal)
- [x] Add comprehensive type validation for Signal implementations (Added in createSignal)
- [x] Verify Window extension types are properly declared (Updated WindowExtensions interface)
- [ ] Ensure type safety across the entire codebase
- [x] Review all type assertions and casting (Removed unnecessary assertions)
- [x] Align window checks with `window != null` pattern (Using isWindowDefined helper)
- [x] Refine unique symbol handling (Simplified to use basic symbol type)
- [x] Ensure compatibility with both signal implementations
  - [x] Create base signal factory function (Implemented createSignal)
  - [x] Implement proper value getters/setters (Added getValue with proper type handling)
  - [x] Add comprehensive type validation (Added in createSignal)
  - [x] Ensure consistent error handling (Using optional chaining and defaults)

## Phase 7: Testing and Documentation
- [ ] Add tests for signal factory function
- [ ] Document signal implementation patterns
- [ ] Add examples of proper signal usage
- [ ] Create migration guide for existing signals
- [ ] Add process documentation
  - [ ] Error investigation workflow
  - [ ] Module resolution troubleshooting
  - [x] Test environment setup guide
  - [x] Critical chain verification process
  - [ ] Signal timing analysis

## Instructions
1. Check each box when the task is completed and verified
2. Add any additional tasks as needed
3. Use this list to track progress
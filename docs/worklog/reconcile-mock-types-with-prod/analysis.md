# Type Analysis for exposeSignals.ts

## Architectural Context
- **Playwright Requirements**:
  - Node.js/browser context isolation
  - Shared type validation
  - Runtime type checking
  - Version synchronization

## Current Implementation Issues

### 1. Signal Interface Mismatch
- **Issue**: The activitySignal implementation doesn't fully match the Signal interface
- **Details**:
  - Missing proper type guards
  - Brand symbol type incompatibility
  - Set method implementation doesn't match interface

### 2. Error Handling
- **Issue**: Unsafe error type handling in executeCommand
- **Details**:
  - Error type checking is too permissive
  - Missing proper error type narrowing

### 3. Tutorial Signals
- **Issue**: Type safety issues in tutorial signals
- **Details**:
  - Inconsistent type casting
  - Missing proper type validation

## Recommended Fixes

### 1. Signal Interface Implementation
- Update activitySignal to match Signal interface exactly
- Add proper type guards
- Fix brand symbol type

### 2. Error Handling
- Implement proper error type checking
- Add type-safe error handling utilities

### 3. Tutorial Signals
- Add proper type validation
- Remove unsafe type casting

## New Tasks for Migration Plan

Add these tasks to Phase 4:

- [ ] Update exposeSignals.ts to match Signal interface
- [ ] Implement proper error handling in executeCommand
- [ ] Fix type safety issues in tutorial signals
- [ ] Add type validation for all signal implementations

## Module Resolution and Type Migration

### Current Status
- Created @handterm/types package
- Migrated core types (Signal, ActivityType, WindowExtensions)
- Updated majority of imports to use @handterm/types

### Remaining Issues
- Some files still importing from src/types/Types:
  - src/signals/tutorialSignals.ts
  - src/signals/appSignals.ts
  - src/types/Types.ts
- Test environment configuration needs updates:
  - TypeScript paths configuration
  - Module resolution settings
  - Playwright test setup

### Recommended Next Steps
1. Update remaining imports in signal files
2. Verify test environment configuration
3. Add integration tests for type exports
4. Create regression tests for module imports
5. Document migration process for future reference
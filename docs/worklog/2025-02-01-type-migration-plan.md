# Type Migration Plan - 2025-02-01

## Task
Moving all types to @handterm/types to ensure type consistency between Node.js/browser contexts for Playwright tests.

## Understanding of the Problem
1. Current type organization is scattered across multiple locations
2. Type safety issues in Monaco editor implementation
3. Need for runtime type validation in Playwright tests
4. Signal interface mismatches and error handling issues

## Analysis
Based on analysis.md and the Monaco editor rewrite checklist:

1. **Current Issues**:
   - Signal interface implementation doesn't match interface exactly
   - Unsafe error type handling in executeCommand
   - Inconsistent type casting in tutorial signals
   - Type safety gaps in Monaco editor implementation

2. **Benefits of Moving to @handterm/types**:
   - Ensures type consistency between Node.js/browser contexts
   - Enables proper runtime type validation
   - Centralizes type definitions
   - Helps with version synchronization
   - Improves Playwright test reliability

## Plan to Solve the Problem

### Phase 1: Type Consolidation
1. Move core types to @handterm/types:
   - [ ] Signal interfaces
   - [ ] Activity types
   - [ ] Window extensions
   - [ ] Monaco editor types
   - [ ] API response types
   - [ ] Test utility types

2. Add runtime type validation:
   - [ ] Type guards for Signal implementations
   - [ ] Error type checking utilities
   - [ ] Monaco editor state validation
   - [ ] API response validation

### Phase 2: Import Updates
1. Use the existing script (scripts/update-type-imports.ts) to:
   - [ ] Find all type imports
   - [ ] Update import statements
   - [ ] Verify type resolution
   - [ ] Run type checks

2. Manual verification of:
   - [ ] Complex type imports
   - [ ] Re-exports
   - [ ] Aliased imports

### Phase 3: Testing & Validation
1. Update test files:
   - [ ] Update to use new type imports
   - [ ] Add type validation tests
   - [ ] Verify Playwright compatibility
   - [ ] Add regression tests for type exports

## Next Steps
1. Begin with Monaco editor types since we have a clear checklist:
   - [ ] Move IStandaloneCodeEditor and related types
   - [ ] Add runtime validation utilities
   - [ ] Update component imports
   - [ ] Add Playwright-compatible type guards

2. Then proceed with signal-related types:
   - [ ] Move Signal interface
   - [ ] Add proper type guards
   - [ ] Fix brand symbol types
   - [ ] Update signal implementations

3. Finally, handle remaining types:
   - [ ] API response types
   - [ ] Test utility types
   - [ ] Terminal-specific types

## Current Status
- [x] Created @handterm/types package
- [x] Migrated some core types
- [x] Have script for updating imports
- [x] Added initial Monaco type definitions

## Next Immediate Actions
1. [ ] Complete Monaco editor type migration as outlined in full-rewrite-checklist.md
2. [ ] Update remaining signal files to use @handterm/types
3. [ ] Verify test environment configuration
4. [ ] Add integration tests for type exports
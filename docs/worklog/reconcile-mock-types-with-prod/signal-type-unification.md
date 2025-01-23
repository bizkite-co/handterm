# Signal Type Unification Implementation

## Problem Statement
- Type mismatches between test/prod environments
- Duplicate type definitions for core signal interfaces
- Fragile window type extensions

## Implementation Strategy
1. Single Source of Truth
   - Define `Signal` interface in @handterm/types
   - Base class for all signal implementations
2. Runtime Validation
   - Type guards for signal verification
   - Enhanced error diagnostics
3. Window Type Safety
   - Strict window extension declarations
   - Compile-time and runtime checks

## Task List
- [ ] Create `src/signals/base/SignalBase.ts`
- [ ] Update command line signal implementation
- [ ] Update activity signal implementation
- [ ] Update tutorial signals implementation
- [ ] Add runtime validation utilities
- [ ] Update window type declarations
- [ ] Verify Playwright test diagnostics
# E2E Test Window Setup

## Problem
The e2e tests are failing because window properties defined in @handterm/types aren't being properly initialized in the test environment.

## Analysis
1. Signal Package Relationships:
   ```typescript
   // @preact/signals-react/dist/signals.d.ts
   import { signal, Signal } from "@preact/signals-core";
   export { signal, Signal };
   ```
   - @preact/signals-react is built on @preact/signals-core
   - It re-exports the core functionality
   - Just adds React-specific extensions

2. Our App's Usage:
   ```typescript
   // src/signals/appSignals.ts
   import { signal } from '@preact/signals-react';
   export const activitySignal = signal<ActivityType>(ActivityType.NORMAL);
   ```
   - Uses @preact/signals-react for React integration
   - But the underlying signal type is from @preact/signals-core

3. Our Types Package:
   ```typescript
   // packages/types/src/signal.ts
   export type { Signal } from '@preact/signals-core';
   ```
   - Correctly uses the core types
   - Compatible with @preact/signals-react usage
   - No need for separate implementations

## Solution
1. Keep Using @preact/signals-core Types:
   - It's the correct foundation
   - Compatible with React usage
   - Provides all needed functionality

2. In Tests:
   ```typescript
   import { signal } from '@preact/signals-core';

   // This works because it's the same core implementation
   window.activitySignal = signal(ActivityType.NORMAL);
   ```

3. Benefits:
   - Type consistency across contexts
   - No implementation duplication
   - Proper React integration in app
   - Clean test environment

## Next Steps
1. Keep @preact/signals-core types in our types package
2. Use @preact/signals-core in test setup
3. Let app continue using @preact/signals-react
4. Document the relationship for future reference

This approach:
- Maintains type safety
- Respects the package hierarchy
- Keeps tests simple
- Matches production behavior
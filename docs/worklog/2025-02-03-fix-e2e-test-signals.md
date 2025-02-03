---
date: 2025-02-03
title: Fix E2E Test Signal Initialization
---

# Task
Debug and fix e2e test failures related to window signal initialization and Node.js environment issues.

# Understanding
1. Primary Issues:
   - Node.js path resolution in WSL environment
   - Window properties from @handterm/types not properly initialized
   - Signal implementation using custom SignalBase instead of @preact/signals-core

2. Code Analysis:
   - exposeSignals.ts has undefined GamePhrases reference
   - Using custom SignalBase class instead of @preact/signals-core as recommended
   - Window signal initialization may be failing silently

# Plan
1. Fix Node.js Environment:
   ```bash
   # Ensure Node.js is installed in WSL (not Windows path)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   nvm use 18
   ```

2. Update Signal Implementation:
   - Replace custom SignalBase with @preact/signals-core
   - Import GamePhrases or mock its functionality
   - Update window property initialization

3. Modify exposeSignals.ts:
   ```typescript
   import { signal } from '@preact/signals-core';

   // Replace custom SignalBase implementations with signals-core
   const activitySignal = signal(ActivityType.NORMAL);
   const tutorialSignals = {
     currentStep: signal(0),
     totalSteps: signal(5), // Mock value, replace with actual total
     isComplete: signal(false)
   };
   ```

4. Update Test Setup:
   - Ensure proper signal initialization before tests
   - Add error handling and logging
   - Verify window properties are correctly set

# Next Steps
1. Update exposeSignals.ts to use @preact/signals-core
2. Add proper error handling and logging
3. Fix Node.js environment in WSL
4. Run tests to verify fixes

# Implementation Notes
- Need to handle GamePhrases dependency
- Consider adding more detailed logging in test setup
- May need to update other test files using these signals
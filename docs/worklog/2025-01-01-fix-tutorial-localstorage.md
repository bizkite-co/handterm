---
date: 2025-01-01
title: Fix Tutorial LocalStorage Testing
---

## Task
Fix the tutorial.spec.ts test to properly use localStorage instead of a state variable for tracking completed tutorials.

## Understanding
- The test currently uses a state variable `completedTutorials`
- The actual system uses localStorage with key 'completed-tutorials'
- Need to set up localStorage with specific array of strings before browser load

## Plan
1. Read and understand current tutorial.spec.ts implementation
2. Identify where localStorage needs to be initialized
3. Modify test setup to use localStorage instead of state variable
4. Ensure tests pass with localStorage implementation

## Next Steps
1. Read tutorial.spec.ts to understand current implementation
2. Identify test setup location
3. Add localStorage initialization

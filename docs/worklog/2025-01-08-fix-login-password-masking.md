---
date: 2025-01-08
title: Fix Login Password Masking
---

# Task
Fix login password masking not working after recent changes.

# Problem Understanding
The login command was not properly masking password characters during input. Investigation revealed incorrect usage of the nullish coalescing operator (??) where logical OR (||) should have been used in useTerminal.ts.

# Solution Plan
Replace instances of nullish coalescing operator with logical OR operator when checking login/signup process state in:
- handleData function
- handleBackspace function

# Implementation
Modified useTerminal.ts to use proper logical operators for checking process state:
```typescript
// Before
if (isInLoginProcessSignal.value ?? isInSignUpProcessSignal.value)

// After
if (isInLoginProcessSignal.value || isInSignUpProcessSignal.value)
```

This ensures the password masking logic is properly triggered when either login or signup process is active.

# Next Steps
Monitor for any other instances where similar logical operator confusion might exist.

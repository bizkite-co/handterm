# ESLint ES Module Compatibility Workaround

## Problem
ESLint plugins like `eslint-plugin-functional` are distributed as ES Modules, which can cause compatibility issues with CommonJS-based ESLint configurations.

## Current Approach
- Removed direct plugin integration
- Implemented equivalent rules using native ESLint rules
- Maintained type safety and functional programming principles

## Recommended Strategies

### 1. Rule Equivalence
Instead of using `eslint-plugin-functional`, we've implemented similar rules:
- `no-var`: Prevents `var` declarations
- `prefer-const`: Encourages immutability
- `no-param-reassign`: Discourages mutation of function parameters

### 2. Manual Type Safety Enforcement
- Added custom `no-restricted-syntax` rules
- Encouraged type guard patterns
- Maintained strict type checking

## Long-Term Solutions
1. Update to ESLint 9.x with full ES Module support
2. Use dynamic import mechanisms
3. Gradually reintroduce functional programming plugins

## Debugging Checklist
- Verify Node.js version compatibility
- Check ESLint and plugin versions
- Ensure consistent module system usage
- Test with minimal configuration

## Functional Programming Principles
```typescript
// Before (Mutable)
let total = 0;
items.forEach(item => {
  total += item.price;
});

// After (Immutable)
const total = items.reduce((sum, item) => sum + item.price, 0);
```

## Type Safety Patterns
```typescript
// Type Guard Example
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// Explicit Null Handling
function processUser(user: User | null) {
  if (user !== null) {
    console.log(user.name);
  }
}
```

## Action Items
1. Monitor linting process
2. Validate type checking
3. Gather team feedback
4. Continuously improve type safety approach

## Resources
- [Type Safety Strategies](/docs/linting/type_safety_strategies.md)
- [ESLint Documentation](https://eslint.org/)
- [TypeScript Type Checking](https://www.typescriptlang.org/docs/handbook/type-checking.html)

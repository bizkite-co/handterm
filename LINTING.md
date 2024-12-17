# ESLint Configuration Guide

This document explains the ESLint configuration choices made for this React/TypeScript/Vite project.

## Core Principles

1. **Type Safety**: Strict TypeScript checking while allowing pragmatic exceptions
2. **Import Organization**: Clear and consistent module organization
3. **Testing Support**: Flexible rules for different types of tests
4. **Code Quality**: Enforced best practices with reasonable warnings

## Unused Variables and Parameters

### Parameter Naming Rules

```typescript
// Good: Unused required callback parameter
function onEvent(_event: Event) {
  // Only using event in types, not in implementation
}

// Good: Unused error in catch clause
try {
  // ...
} catch (_error) {
  // Only need to catch, not use error
}

// Bad: Underscore prefix without additional characters
function process(_: string) {} // Error: Must have chars after underscore

// Bad: Unused variable with underscore
const _unused = 'something'; // Error: Variables can't use underscore prefix
```

The configuration enforces:
- Only allow underscore prefix for required callback parameters
- Must have at least one character after underscore
- Only allow `_error` in catch clauses
- No unused variables with underscore prefix (they should be removed)

### Rationale

1. **Required Parameters**: Sometimes callback parameters are required by type but not used in implementation. Prefixing with underscore makes this explicit.
2. **Catch Clauses**: When you need to catch errors but don't use them, `_error` is the standard name.
3. **Variables**: Unlike parameters, variables are never "required" by the type system, so unused ones should be removed.

## Naming Conventions

### Variables and Functions

```typescript
// Variables
const myVariable = 'value';          // Good: camelCase
const MyComponent = () => {};        // Good: PascalCase for components
const MAX_VALUE = 100;              // Good: UPPER_CASE for constants

// Functions
function handleClick() {}           // Good: camelCase
function MyComponent() {}           // Good: PascalCase for components
```

### Types and Interfaces

```typescript
// Good: PascalCase for types
interface UserProps {
  name: string;
}

// Good: PascalCase for enums
enum ButtonSize {
  Small = 'small',
  Large = 'large'
}

// Bad: non-PascalCase for types
interface userProps {}              // Error: Must be PascalCase
```

### Parameters

```typescript
// Good: camelCase for used parameters
function process(userData: UserData) {}

// Good: underscore prefix for unused required parameters
function onEvent(_event: Event) {}

// Bad: underscore without reason
function process(_data: Data) {}    // Error: Parameter is used but has underscore
```

## Import Organization

Imports are organized in the following order:

1. React and core libraries
2. External libraries
3. Internal modules
4. Relative imports
5. Type imports

```typescript
// Good import order
import React from 'react';
import { signal } from '@preact/signals-react';
import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MyComponent } from '@/components';
import { useAuth } from '../hooks/useAuth';
import type { UserData } from './types';

// Bad: Wrong order
import { useAuth } from '../hooks/useAuth';
import React from 'react';          // Error: React should come first
```

## Testing Configuration

### Unit Tests

More lenient rules for test files:
- Allow any types
- Allow non-null assertions
- Allow unused variables with underscore
- Relaxed naming conventions

```typescript
// Good: Test-specific patterns allowed
describe('MyComponent', () => {
  const _unusedInTest = 'value';    // Allowed in tests
  const element = screen.getByRole('button')!;  // Non-null assertion allowed
});
```

### E2E Tests

Even more relaxed rules:
- No screen query requirements
- Allow unsafe operations
- Flexible naming

## Common Issues and Solutions

### Unused Variables

```typescript
// Problem: Unused variable
const unused = 'value';             // Error: Unused variable

// Solution: Remove it
// No unused variables allowed, even with underscore prefix
```

### Required Unused Parameters

```typescript
// Problem: Required callback parameter
function onClick(event: Event) {}    // Error: event is unused

// Solution: Use underscore prefix
function onClick(_event: Event) {}
```

### Promise Handling

```typescript
// Problem: Unhandled promise
somePromise();                      // Error: Floating promise

// Solution 1: Use void operator
void somePromise();

// Solution 2: Use async IIFE
void (async () => {
  await somePromise();
})();
```

## Maintenance

When updating the ESLint configuration:

1. Consider the impact on existing code
2. Test changes with `npm run lint`
3. Document significant changes
4. Update this guide as needed

## Configuration Files

The complete configuration is in `.eslintrc.cjs`. Key files:

- `.eslintrc.cjs`: Main ESLint configuration
- `tsconfig.json`: TypeScript configuration for source
- `tsconfig.test.json`: TypeScript configuration for tests

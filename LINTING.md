# ESLint Configuration Guide

## Core Philosophy

This ESLint configuration represents our gold standard for code quality. We deliberately configure rules to enforce best practices, rather than accommodating existing patterns. When encountering linting errors, the solution is to improve the code to meet our standards, not to relax the rules.

Key principles:
1. Type safety is non-negotiable
2. Explicit is better than implicit
3. Consistency across the codebase
4. No unsafe operations
5. Clean and maintainable code
6. Refine linting rules for the project-specific tech stack.

## Type Safety

### Core Rules
```typescript
'@typescript-eslint/no-explicit-any': 'error',
'@typescript-eslint/no-unsafe-assignment': 'error',
'@typescript-eslint/no-unsafe-member-access': 'error',
'@typescript-eslint/no-unsafe-call': 'error',
'@typescript-eslint/no-unsafe-return': 'error',
'@typescript-eslint/no-unsafe-argument': 'error',
```

### Rationale
- Type safety prevents runtime errors
- Makes code self-documenting
- Enables better tooling support
- Facilitates refactoring

### Examples

```typescript
// BAD: Using any
function process(data: any): any {
  return data.someField;
}

// GOOD: Proper typing
interface Data {
  someField: string;
}
function process(data: Data): string {
  return data.someField;
}
```

## Promise Handling

### Core Rules
```typescript
'@typescript-eslint/no-floating-promises': 'error',
'@typescript-eslint/require-await': 'error',
'@typescript-eslint/no-misused-promises': ['error', {
  checksVoidReturn: true,
  checksConditionals: true,
  checksSpreads: true,
}],
```

### Rationale
- Unhandled promises can lead to silent failures
- Async functions should have a purpose
- Promise handling should be explicit

### Examples

```typescript
// BAD: Floating promise
someAsyncOperation();

// GOOD: Explicit handling
await someAsyncOperation();
// or
void someAsyncOperation();
// or
someAsyncOperation().catch(handleError);

// BAD: Async without await
async function noAwait(): Promise<void> {
  doSomething(); // No await needed
}

// GOOD: Proper async usage
async function withAwait(): Promise<void> {
  await someAsyncOperation();
}
```

## Naming Conventions

### Core Rules
```typescript
'@typescript-eslint/naming-convention': [
  'error',
  {
    selector: 'default',
    format: ['camelCase'],
    leadingUnderscore: 'forbid',
    trailingUnderscore: 'forbid',
  },
  // Additional configurations for different types
]
```

### Rationale
- Consistent naming improves readability
- Different cases convey different meanings
- No leading underscores (except in very specific cases)

### Examples

```typescript
// BAD: Inconsistent naming
const user_data = getData();
const APIEndpoint = '/api';
const _privateVar = 'hidden';

// GOOD: Consistent naming
const userData = getData();
const API_ENDPOINT = '/api';
const privateVar = 'hidden';

// GOOD: React components in PascalCase
function UserProfile(): JSX.Element {
  return <div>Profile</div>;
}

// GOOD: Event handlers
function handleClick(): void {
  // ...
}
```

## Import Organization

### Core Rules
```typescript
'import/order': ['error', {
  groups: [
    'builtin',
    'external',
    'internal',
    'parent',
    'sibling',
    'index',
    'object',
    'type'
  ],
  'newlines-between': 'always',
  // Additional configurations
}],
'import/no-default-export': 'error',
```

### Rationale
- Organized imports improve readability
- Named exports are more refactoring-friendly
- Clear separation between different types of imports

### Examples

```typescript
// GOOD: Organized imports
import React, { useState } from 'react';

import { signal } from '@preact/signals-react';
import { QueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';

import { type User } from './types';
import { formatDate } from './utils';

// BAD: Default exports
export default function Component() {}

// GOOD: Named exports
export function Component(): JSX.Element {}
```

## React Best Practices

### Core Rules
```typescript
'react/function-component-definition': ['error', {
  namedComponents: 'function-declaration',
  unnamedComponents: 'arrow-function',
}],
'react-hooks/exhaustive-deps': 'error',
```

### Rationale
- Consistent component definitions
- Proper hook dependencies
- Explicit event handler naming

### Examples

```typescript
// BAD: Inconsistent component definition
const Component = () => {
  return <div />;
};

// GOOD: Function declaration for named components
function Component(): JSX.Element {
  return <div />;
}

// BAD: Missing dependencies
useEffect(() => {
  doSomething(value);
}, []); // value is missing from deps

// GOOD: Complete dependencies
useEffect(() => {
  doSomething(value);
}, [value]);
```

## Testing Standards

### Core Rules
```typescript
'testing-library/prefer-screen-queries': 'error',
'testing-library/no-debugging-utils': process.env.CI ? 'error' : 'warn',
```

### Rationale
- Consistent testing patterns
- No debugging code in production
- Clear test structure

### Examples

```typescript
// BAD: Direct queries
const element = container.querySelector('.button');

// GOOD: Screen queries
const element = screen.getByRole('button');

// BAD: Debugging in tests
console.log(element);

// GOOD: Clear assertions
expect(element).toBeInTheDocument();
```

## Configuration Files

Special rules apply to configuration files:
- Allow require statements
- Allow default exports
- Allow console usage

This is because configuration files often need to work in different environments and follow different patterns than application code.

## Maintenance

When encountering linting errors:

1. **Understand the Rule**
   - Read the rule documentation
   - Understand why it exists
   - Consider the benefits it provides

2. **Fix the Code**
   - Improve the code to meet the standard
   - Don't disable rules without strong justification
   - Document any necessary exceptions

3. **Review Impact**
   - Consider if similar issues exist elsewhere
   - Update related code for consistency
   - Add tests if needed

4. **Documentation**
   - Update comments if needed
   - Document any non-obvious patterns
   - Share learnings with the team

Remember: The goal is to improve code quality, not to make the linter happy. When you encounter a linting error, ask "How can I make this code better?" rather than "How can I make this error go away?"

# ESLint Configuration Guide

This document explains the ESLint configuration choices made for this React/TypeScript/Vite project.

## Core Principles

1. **Type Safety**: Strict TypeScript checking while allowing pragmatic exceptions
2. **Import Organization**: Clear and consistent module organization
3. **Testing Support**: Flexible rules for different types of tests
4. **Code Quality**: Enforced best practices with reasonable warnings

## Key Configuration Areas

### TypeScript Rules

- Strict type checking with warnings for unsafe operations
- Consistent type imports using `import type`
- Interface preference over type aliases
- Special handling for Promise-related code
- Relaxed rules for test files and type declarations

```js
'@typescript-eslint/consistent-type-imports': ['warn', {
  prefer: 'type-imports',
  fixStyle: 'inline-type-imports',
  disallowTypeAnnotations: true,
}]
```

### Import Organization

- React and @preact imports are prioritized
- Clear separation between external and internal imports
- Special handling for test-related imports
- Enforced newlines between import groups

```js
'import/order': [
  'error',
  {
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
    // Special handling for React and other key libraries
    pathGroups: [
      {
        pattern: 'react',
        group: 'builtin',
        position: 'before'
      },
      {
        pattern: '@preact/**',
        group: 'external',
        position: 'after'
      }
    ]
  }
]
```

### Testing Configuration

Different rules for different test types:

1. **Unit Tests** (`src/**/*.test.tsx`):
- Relaxed type checking
- Enforced testing library best practices
- Screen query preferences
- Debug utilities allowed in development

2. **E2E Tests** (`e2e/**/*`):
- Very relaxed type checking
- No screen query requirements
- Special handling for Playwright patterns

3. **Test Utils** (`src/test-utils/**/*`):
- Relaxed class and method rules
- Special handling for mock implementations

### File-Type Specific Rules

1. **TypeScript Declaration Files** (`.d.ts`):
- Relaxed type checking
- No unused variable checks
- Flexible type definitions

2. **Configuration Files** (`*.config.ts`):
- Relaxed require rules
- Console statements allowed
- Default exports allowed

3. **Mock Files** (`__mocks__/**/*`):
- Relaxed class structure rules
- Flexible type handling
- Special method binding rules

## Common Patterns

### Promise Handling

```typescript
// Allowed: Explicit void operator
void somePromise();

// Allowed: IIFE with await
void (async () => {
  await somePromise();
})();

// Warning: Floating promise
somePromise(); // warns about unhandled promise
```

### Type Imports

```typescript
// Preferred: Type imports
import type { MyType } from './types';

// Warning: Value imports for types
import { MyType } from './types'; // warns about type-only import
```

### React Patterns

```typescript
// Allowed: Modern React imports
import { useState } from 'react';

// Error: Legacy React import
import React from 'react'; // error about unnecessary import
```

## Customization

The configuration can be adjusted based on team preferences:

1. **Warning Levels**: Many rules are set to 'warn' instead of 'error' to allow for gradual adoption
2. **Type Safety**: Unsafe operations are warnings to allow for pragmatic exceptions
3. **Test Configuration**: Different rules for different test types
4. **Import Organization**: Customizable import grouping and ordering

## Maintenance

When updating the ESLint configuration:

1. Consider the impact on existing code
2. Test changes with `npm run lint`
3. Document significant changes
4. Consider adding new patterns to this guide

## Common Issues

1. **Import Ordering**: Use the `--fix` option to automatically fix import order issues
2. **Type Safety**: Use type assertions judiciously and document when necessary
3. **Test Files**: Different rules apply to different test types
4. **Promise Handling**: Use void operator or async IIFE for unhandled promises

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

import { useAuth } from 'hooks/useAuth' (see below for file content);
import { Button } from 'components/Button' (see below for file content);

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

## React Rules

### `react/react-in-jsx-scope`

- **Current Setting:** `'off'`
- **Rationale:** Not needed with the new JSX transform introduced in React 17.
- **AirBNB:**  Effectively `off` due to the inclusion of `plugin:react/jsx-runtime` in `eslint-config-airbnb-typescript`.
- **Recommendation:** Keep this rule turned off.
- **Example:**

```jsx
// No need to import React with the new JSX transform
function MyComponent() {
  return <div>Hello</div>;
}
```

### `react/prop-types`

- **Current Setting:** `'off'`
- **Rationale:** Prop type checking is handled by TypeScript.
- **AirBNB:** Likely enabled, but less relevant when using `eslint-config-airbnb-typescript`.
- **Recommendation:** Keep this rule turned off.
- **Example:**

```typescript
// Type checking is done through TypeScript interfaces
interface Props {
  message: string;
}

function MyComponent({ message }: Props): JSX.Element {
  return <div>{message}</div>;
}
```

### `react/jsx-uses-react`

-   **Current Setting:** `'off'`
-   **Rationale:** Not needed with the new JSX transform introduced in React 17. Prevents marking `React` as unused when the `react/react-in-jsx-scope` rule is turned off.
-   **AirBNB:** Effectively `off` due to the inclusion of `plugin:react/jsx-runtime` in `eslint-config-airbnb-typescript`.
-   **Recommendation:** Keep this rule turned off.
-   **Example:**

```jsx
// The React variable is not needed in scope with the new JSX transform
function MyComponent() {
  return <div>Hello</div>;
}
```

### `react/jsx-handler-names`

-   **Current Setting:**
    ```
    ['error', {
      eventHandlerPrefix: 'handle',
      eventHandlerPropPrefix: 'on',
      checkLocalVariables: true,
    }]
    ```
-   **Rationale:** Enforces a consistent naming convention for event handlers, improving code readability and maintainability.
-   **AirBNB:** Similar rule, but doesn't check local variables by default and allows a `handle` prefix for event handler props.
-   **Recommendation:** Keep this rule as is. The `checkLocalVariables` option is beneficial for catching inconsistencies.
-   **Example:**

```jsx
function MyComponent() {
  const handleInputChange = (event) => {
    // ...
  };

  const onButtonClick = () => {
    // ...
  };

  return (
    <div>
      <input onChange={handleInputChange} />
      <button onClick={onButtonClick}>Click me</button>
    </div>
  );
}
```

### `react/jsx-key`

-   **Current Setting:**
    ```
    ['error', {
      checkFragmentShorthand: true,
      checkKeyMustBeforeSpread: true,
      warnOnDuplicates: true,
    }]
    ```
-   **Rationale:** Enforces the use of the `key` prop when rendering lists of elements, which is essential for React's reconciliation algorithm and performance optimization. The additional options provide further checks for correct key usage.
-   **AirBNB:** Similar rule, but without `checkFragmentShorthand` and `checkKeyMustBeforeSpread`. It does include `warnOnDuplicates`.
-   **Recommendation:** Keep this rule as is. The additional options are valuable for catching potential issues.
-   **Example:**

```jsx
function MyListComponent({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

// With fragment shorthand and spread attributes:
function MyComponent({ items, ...props }) {
  return (
    <>
      {items.map(item => (
        <React.Fragment key={item.id} {...props}>
          <div>{item.name}</div>
        </React.Fragment>
      ))}
    </>
  );
}
```

### `react/function-component-definition`

-   **Current Setting:**
    ```
    ['error', {
      namedComponents: 'function-declaration',
      unnamedComponents: 'arrow-function',
    }]
    ```
-   **Rationale:** Enforces a consistent style for defining React function components. See also the "React Best Practices" section.
-   **AirBNB:** Allows both function declarations and arrow functions for both named and unnamed components, but prefers function declarations for components that use `propTypes`, `defaultProps`, or `contextTypes`.
-   **Recommendation:** Keep this rule as is.

### `react/jsx-no-useless-fragment`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows unnecessary `<Fragment>` or `<>` components, improving code readability and reducing the size of the component tree.
-   **AirBNB:** Also enabled, with `allowExpressions: true` by default.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```jsx
// BAD: Unnecessary fragment
function MyComponent() {
  return (
    <React.Fragment>
      <div>Hello</div>
    </React.Fragment>
  );
}

// GOOD: No fragment needed
function MyComponent() {
  return (
    <div>Hello</div>
  );
}

// GOOD: Fragment with multiple children
function MyComponent() {
  return (
    <>
      <div>Hello</div>
      <div>World</div>
    </>
  );
}
```

### `react/jsx-pascal-case`

-   **Current Setting:** `'error'`
-   **Rationale:** Enforces that JSX elements are written in PascalCase, following the standard convention for React components.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```jsx
// BAD: lowercase component name
function mycomponent() {
  return <div />;
}

// GOOD: PascalCase component name
function MyComponent() {
  return <div />;
}

// BAD: Using lowercase in JSX
<mycomponent />;

// GOOD: Using PascalCase in JSX
<MyComponent />;
```

## TypeScript Rules

### `@typescript-eslint/explicit-module-boundary-types`

-   **Current Setting:** `'error'`
-   **Rationale:** Requires that functions exported from a module have explicit return types and that their parameters are also explicitly typed. This improves code maintainability and helps catch type errors at module boundaries.
-   **AirBNB:** Not enabled by default.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
// BAD: Missing return type
export function add(a, b) {
  return a + b;
}

// GOOD: Explicit return type
export function add(a: number, b: number): number {
  return a + b;
}
```

### `@typescript-eslint/no-unused-vars`

-   **Current Setting:**
    ```
    ['error', {
      argsIgnorePattern: '^_[a-zA-Z][a-zA-Z0-9]*$',
      caughtErrorsIgnorePattern: '^_error$',
    }]
    ```
-   **Rationale:** Disallows unused variables, which helps keep the codebase clean and maintainable. The ignore patterns provide flexibility for specific cases.
-   **AirBNB:** Similar rule, but with a simpler `argsIgnorePattern` of `^_` and no `caughtErrorsIgnorePattern`.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
// BAD: Unused variable
function myFunction() {
  const unused = 10;
  console.log("Hello");
}

// GOOD: No unused variables
function myFunction() {
  console.log("Hello");
}

// GOOD: Unused argument with allowed pattern
function myOtherFunction(_unusedArg: string, arg2: number) {
  console.log(arg2);
}

// GOOD: Unused error variable with allowed pattern
try {
  // ...
} catch (_error) {
  console.log("An error occurred, but we're ignoring it for now.");
}
```

### `@typescript-eslint/no-explicit-any`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows the use of the `any` type, which undermines the benefits of static typing. See also the "Type Safety" section.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.

### `@typescript-eslint/consistent-type-imports`

-   **Current Setting:**
    ```
    ['error', {
      prefer: 'type-imports',
      fixStyle: 'inline-type-imports',
      disallowTypeAnnotations: true,
    }]
    ```
-   **Rationale:** Enforces a consistent style for type imports using the `type` keyword, which can help with tree-shaking and improve build performance. It also makes it clear which imports are only used for type checking.
-   **AirBNB:** Not enabled by default.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
// BAD: Regular import for a type
import { MyType } from './my-module';

// GOOD: Type import
import { type MyType } from './my-module';

// GOOD: Inline type import
import { value, type MyType } from './my-module';
```

### `@typescript-eslint/consistent-type-definitions`

-   **Current Setting:** `['error', 'interface']`
-   **Rationale:** Enforces the use of `interface` instead of `type` for defining object types, promoting consistency.
-   **AirBNB:** Not enabled by default.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
// BAD: Using type for an object type
type User = {
  name: string;
  age: number;
};

// GOOD: Using interface for an object type
interface User {
  name: string;
  age: number;
}
```

### `@typescript-eslint/no-misused-promises`

-   **Current Setting:**
    ```
    ['error', {
      checksVoidReturn: true,
      checksConditionals: true,
      checksSpreads: true,
    }]
    ```
-   **Rationale:** Helps prevent common mistakes when working with promises, such as using a promise in a place where a void return is expected or using a promise directly in a conditional statement without awaiting it. See also the "Promise Handling" section.
-   **AirBNB:** Not enabled by default.
-   **Recommendation:** Keep this rule as is.

### `@typescript-eslint/no-floating-promises`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows promises that are not handled with `await`, `.catch()`, or `.then()`, preventing unhandled rejections. See also the "Promise Handling" section.
-   **AirBNB:** Not enabled by default.
-   **Recommendation:** Keep this rule as is.

### `@typescript-eslint/require-await`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows `async` functions that don't have an `await` expression inside them, ensuring that they are used purposefully. See also the "Promise Handling" section.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.

### `@typescript-eslint/no-unsafe-assignment`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows assigning a value of type `any` to a variable or property that has a more specific type, preventing potential runtime errors. See also the "Type Safety" section.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.

### `@typescript-eslint/no-unsafe-member-access`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows accessing a member of a value that has the `any` type, preventing potential runtime errors. See also the "Type Safety" section.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.

### `@typescript-eslint/no-unsafe-call`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows calling a value of type `any` as a function, preventing potential runtime errors. See also the "Type Safety" section.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.

### `@typescript-eslint/no-unsafe-return`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows returning a value of type `any` from a function that has a more specific return type, preventing potential runtime errors. See also the "Type Safety" section.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.

### `@typescript-eslint/no-unsafe-argument`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows passing an argument of type `any` to a function that expects a more specific type, preventing potential runtime errors. See also the "Type Safety" section.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.

### `@typescript-eslint/unbound-method`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows using a method reference without explicitly binding it to its object, preventing unexpected behavior when the method is called with a different `this` context.
-   **AirBNB:** Not enabled by default.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
class MyClass {
  myMethod() {
    console.log(this);
  }
}

const obj = new MyClass();

// BAD: Unbound method reference
const unbound = obj.myMethod;
unbound(); // Logs the global object instead of obj

// GOOD: Bound method reference
const bound = obj.myMethod.bind(obj);
bound(); // Logs obj

// GOOD: Immediately invoked method
obj.myMethod();
```

### `@typescript-eslint/no-unnecessary-type-assertion`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows type assertions that do not change the type of an expression, keeping the code clean and avoiding unnecessary verbosity.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
// BAD: Unnecessary type assertion
const myNumber = 10 as number;

// GOOD: No type assertion needed
const myNumber = 10;

// GOOD: Type assertion that changes the type
const myValue: unknown = 10;
const myNumber = myValue as number;
```

### `@typescript-eslint/no-redundant-type-constituents`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows type unions and intersections that include types already included in other constituents, keeping type definitions concise and avoiding redundancy.
-   **AirBNB:** Not enabled by default.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
// BAD: Redundant type constituents
type MyType = string | string;
type MyOtherType = { name: string } & { name: string };

// GOOD: No redundant constituents
type MyType = string;
type MyOtherType = { name: string };
```

### `@typescript-eslint/strict-boolean-expressions`

-   **Current Setting:**
    ```
    ['error', {
      allowString: false,
      allowNumber: false,
      allowNullableObject: false,
      allowNullableBoolean: false,
      allowNullableString: false,
      allowNullableNumber: false,
      allowAny: false,
    }]
    ```
-   **Rationale:** Enforces strict boolean expressions in conditional statements, disallowing implicit conversions of non-boolean values to booleans. This prevents subtle bugs that can arise from unexpected truthy/falsy evaluations.
-   **AirBNB:** Not enabled by default.
-   **Recommendation:** Keep this rule as is. The strict configuration ensures maximum type safety.
-   **Example:**

```typescript
// BAD: Implicit boolean conversion
const myString = '';
if (myString) {
  // This will not be executed, even though myString is not a boolean
}

// GOOD: Explicit boolean expression
const myString = '';
if (myString !== '') {
  // This will be executed as expected
}
```

### `@typescript-eslint/naming-convention`

-   **Current Setting:**
    ```
    [
      'error',
      {
        selector: 'default',
        format: ['camelCase'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'property',
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
    ]
    ```
-   **Rationale:** Enforces consistent naming conventions for different code elements, improving code readability and maintainability. See also the "Naming Conventions" section.
-   **AirBNB:** Similar rule, but less granular and doesn't have specific configurations for different selectors.
-   **Recommendation:** Keep this rule as is.
-   **Specific Configurations:**
    -   **`default`:** `camelCase`
    -   **`variable`:** `camelCase`, `PascalCase` (for React components), `UPPER_CASE` (for constants)
    -   **`function`:** `camelCase`, `PascalCase` (for React components)
    -   **`typeLike` (classes, interfaces, type aliases, enums, generics):** `PascalCase`
    -   **`enumMember`:** `UPPER_CASE`
    -   **`parameter`:** `camelCase`
    -   **`property`:** `camelCase`, `UPPER_CASE` (for constants)
-   **Example:**

```typescript
// Variables
const myVariable = 10;
const MyComponent = () => <div />;
const MY_CONSTANT = 100;

// Functions
function myFunction() {}
function MyComponent() { return <div />; }

// Types
interface MyInterface {}
type MyType = string;
enum MyEnum {
  VALUE_ONE,
  VALUE_TWO,
}

// Parameters
function myFunction(paramOne: string, paramTwo: number) {}

// Properties
const myObject = {
  myProperty: 10,
  MY_CONSTANT_PROPERTY: 100,
};

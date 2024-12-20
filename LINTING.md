## In Progress

This document is being updated to include a detailed analysis of each ESLint rule in `.eslintrc.cjs`. Each rule is compared with the AirBNB style guide and other modern best practices. Recommendations are provided for each rule based on the project's specific tech stack and goals.

**Completed Sections:**

-   Core Philosophy
-   Type Safety
-   Promise Handling
-   Naming Conventions
-   Import Organization
-   React Best Practices
-   Testing Standards
-   Configuration Files
-   Maintenance
-   React Rules
-   TypeScript Rules
-   Import Rules (up to `import/no-mutable-exports`)
-   React Hooks Rules

**Pending Sections:**

-   Accessibility Rules
-   General Rules
-   Overrides
-   Ignore Patterns

---

# ESLint Configuration Guide

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
```

## Import Rules

### `import/order`

-   **Current Setting:**
    ```
    [
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
          },
          {
            pattern: '@tanstack/**',
            group: 'external',
            position: 'after'
          },
          {
            pattern: '@testing-library/**',
            group: 'external',
            position: 'after'
          },
          {
            pattern: 'src/**',
            group: 'internal',
            position: 'before'
          }
        ],
        pathGroupsExcludedImportTypes: ['react', '@preact/**'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        }
      }
    ]
    ```
-   **Rationale:** Enforces a specific order for import statements, grouping them based on their type and allowing for custom path groups. It also enforces newlines between groups and alphabetical ordering within each group. See also the "Import Organization" section.
-   **AirBNB:** Similar rule, but less granular in its grouping and doesn't have the `pathGroups` option.
-   **Recommendation:** Keep this rule as is.
-   **Specific Configurations:**
    -   **`groups`:** Defines the order of import groups: `builtin`, `external`, `internal`, `parent`, `sibling`, `index`, `object`, `type`.
    -   **`pathGroups`:** Defines custom path groups for specific modules:
        -   `react`: Treated as a `builtin` module and placed before other builtin modules.
        -   `@preact/**`, `@tanstack/**`, `@testing-library/**`: Treated as `external` modules but placed after other external modules.
        -   `src/**`: Treated as `internal` modules and placed before other internal modules.
    -   **`pathGroupsExcludedImportTypes`:** Excludes `react` and `@preact/**` from being considered in certain path group calculations.
    -   **`newlines-between`:** Enforces newlines between import groups.
    -   **`alphabetize`:** Enforces alphabetical ordering within each group (case-insensitive).

### `import/no-duplicates`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows multiple imports from the same module, preventing redundancy and improving code clarity.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
// BAD: Duplicate imports
import { MyComponent } from './my-module';
import { MyOtherComponent } from './my-module';

// GOOD: Single import with multiple named imports
import { MyComponent, MyOtherComponent } from './my-module';
```

### `import/no-default-export`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows the use of default exports, promoting the use of named exports. See also the "Import Organization" section.
-   **AirBNB:** Not enabled by default.
-   **Recommendation:** Keep this rule as is.

### `import/no-cycle`

-   **Current Setting:**
    ```
    ['error', {
      maxDepth: 1,
      ignoreExternal: true
    }],
    ```
-   **Rationale:** Disallows circular dependencies between modules, which can lead to complex and hard-to-maintain code.
-   **AirBNB:** Also enabled, but with `maxDepth: Infinity` by default.
-   **Recommendation:** Keep this rule as is for now. Consider increasing `maxDepth` if deeper circular dependencies become a problem.
-   **Specific Configurations:**
    -   `maxDepth: 1`: Restricts the check to a maximum depth of 1 (direct circular dependencies).
    -   `ignoreExternal: true`: Ignores external modules when checking for cycles.
-   **Example:**

```typescript
// BAD: Circular dependency between moduleA and moduleB
// moduleA.ts
import { functionB } from './moduleB';

export function functionA() {
  // ...
  functionB();
  // ...
}

// moduleB.ts
import { functionA } from './moduleA';

export function functionB() {
  // ...
  functionA();
  // ...
}
```

### `import/no-unresolved`

-   **Current Setting:** `'error'`
-   **Rationale:** Ensures that imported modules can be resolved by the module resolver, preventing runtime errors caused by incorrect import paths or missing modules.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
// BAD: Importing a module that doesn't exist
import { MyComponent } from './non-existent-module';

// GOOD: Importing a module that exists
import { MyComponent } from './existing-module';
```

### `import/first`

-   **Current Setting:** `'error'`
-   **Rationale:** Enforces that all `import` statements are at the top of the file, before any other statements, improving code organization and readability.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
// BAD: Import statement after other code
const myVar = 10;
import { myFunction } from './my-module';

// GOOD: Import statement at the top
import { myFunction } from './my-module';

const myVar = 10;
```

### `import/exports-last`

-   **Current Setting:** `'error'`
-   **Rationale:** Enforces that all `export` statements are at the bottom of the file, after any other statements, improving code organization and readability.
-   **AirBNB:** Not enabled by default.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
// BAD: Export statement before other code
export function myFunction() {
  // ...
}

const myVar = 10;

// GOOD: Export statement at the end
const myVar = 10;

export function myFunction() {
  // ...
}
```

### `import/no-mutable-exports`

-   **Current Setting:** `'error'`
-   **Rationale:** Disallows the use of mutable exports with `let` or `var`, promoting immutability and preventing accidental modification of exported values from other modules.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```typescript
// BAD: Mutable export using let
export let myVar = 10;

// GOOD: Immutable export using const
export const myVar = 10;
```

## React Hooks Rules

### `react-hooks/rules-of-hooks`

-   **Current Setting:** `'error'`
-   **Rationale:** Enforces the Rules of Hooks, ensuring that Hooks are called only inside React function components and are called unconditionally from the top level of the component. This prevents subtle bugs that can arise from conditional or nested Hook calls.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Example:**

```jsx
// BAD: Conditional Hook call
function MyComponent({ condition }) {
  if (condition) {
    const [count, setCount] = useState(0); // This is a conditional Hook call
    // ...
  }
  // ...
}

// BAD: Hook call inside a loop
function MyComponent({ items }) {
  for (let i = 0; i < items.length; i++) {
    const [value, setValue] = useState(items[i]); // This is a Hook call inside a loop
    // ...
  }
  // ...
}

// BAD: Hook call inside a nested function
function MyComponent() {
  function nestedFunction() {
    const [value, setValue] = useState(0); // This is a Hook call inside a nested function
    // ...
  }
  // ...
}

// GOOD: Hooks called at the top level of a function component
function MyComponent({ condition, items }) {
  const [count, setCount] = useState(0);
  const [values, setValues] = useState(items);

  useEffect(() => {
    // It's OK to use Hooks inside useEffect
    const [value, setValue] = useState(0);
    // ...
  }, []);

  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### `react-hooks/exhaustive-deps`

-   **Current Setting:** `'error'`
-   **Rationale:** Requires that all dependencies used inside `useEffect`, `useMemo`, `useCallback`, and other effect-like Hooks are included in the dependency array. This ensures that the effect re-runs whenever any of its dependencies change, preventing stale closures and unexpected behavior.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is. It is crucial for preventing subtle bugs that can be hard to track down.
-   **Example:**

```jsx
// BAD: Missing dependency
function MyComponent({ value }) {
  useEffect(() => {
    doSomething(value); // `value` is used inside the effect but not included in the deps array
  }, []); // Missing dependency: `value`
}

// GOOD: All dependencies included
function MyComponent({ value }) {
  useEffect(() => {
    doSomething(value);
  }, [value]); // `value` is included in the deps array
}

// BAD: Unnecessary dependency
function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = 'You clicked ' + count + ' times';
  }, [count, setCount]); // `setCount` is a setter from useState and will never change, so it doesn't need to be included
}

// GOOD: Only necessary dependencies included
function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = 'You clicked ' + count + ' times';
  }, [count]); // Only `count` is included in the deps array
}
```

## Accessibility Rules

## General Rules

## Overrides

## Ignore Patterns

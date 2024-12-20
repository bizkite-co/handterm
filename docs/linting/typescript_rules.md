
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

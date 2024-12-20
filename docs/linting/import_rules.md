
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

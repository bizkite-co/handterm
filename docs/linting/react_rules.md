
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

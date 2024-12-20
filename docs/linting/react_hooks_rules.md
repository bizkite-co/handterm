## React Hooks Rules

React Hooks are a powerful feature in React that allow you to use state and other React features without writing a class. However, they come with specific rules that must be followed to ensure correct behavior and prevent subtle bugs.

### Overview of React Hooks Rules

React provides two primary rules for using Hooks:
1. Only call Hooks at the top level of your React function components or custom Hooks.
2. Only call Hooks from React function components or custom Hooks.

### `react-hooks/rules-of-hooks`

-   **Current Setting:** `'error'`
-   **Rationale:** Enforces the fundamental Rules of Hooks, ensuring that Hooks are called only inside React function components and are called unconditionally from the top level of the component. This prevents subtle bugs that can arise from conditional or nested Hook calls.
-   **Why This Matters:**
    - React relies on the order of Hook calls to maintain state between re-renders.
    - Conditional or nested Hook calls can break this mechanism, leading to unpredictable behavior.
    - The linter helps catch these issues during development.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Detailed Examples:**

```jsx
// BAD: Conditional Hook call
function MyComponent({ condition }) {
  if (condition) {
    const [count, setCount] = useState(0); // ❌ Conditional Hook call
  }
  // This breaks the Rules of Hooks
}

// BAD: Hook call inside a loop
function MyComponent({ items }) {
  for (let i = 0; i < items.length; i++) {
    const [value, setValue] = useState(items[i]); // ❌ Hook call inside a loop
  }
  // This can cause inconsistent state and render issues
}

// BAD: Hook call inside a nested function
function MyComponent() {
  function nestedFunction() {
    const [value, setValue] = useState(0); // ❌ Hook call inside a nested function
  }
  // Hooks must be called directly in the component body
}

// GOOD: Hooks called at the top level of a function component
function MyComponent({ condition, items }) {
  // ✅ Hooks are called unconditionally at the top level
  const [count, setCount] = useState(0);
  const [values, setValues] = useState(items);

  // It's OK to use conditional logic AFTER Hook calls
  if (condition) {
    // You can use Hook values conditionally
    return <div>{count}</div>;
  }

  return (
    <div>
      {values.map(value => (
        <span key={value}>{value}</span>
      ))}
    </div>
  );
}
```

### `react-hooks/exhaustive-deps`

-   **Current Setting:** `'error'`
-   **Rationale:** Requires that all dependencies used inside `useEffect`, `useMemo`, `useCallback`, and other effect-like Hooks are included in the dependency array. This ensures that the effect re-runs whenever any of its dependencies change, preventing stale closures and unexpected behavior.
-   **Why This Matters:**
    - Missing dependencies can lead to bugs where your effect doesn't update when it should.
    - Stale closures can cause your code to use outdated values from previous renders.
    - The linter helps you explicitly track and manage dependencies.
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is. It is crucial for preventing subtle bugs that can be hard to track down.
-   **Detailed Examples:**

```jsx
// BAD: Missing dependency
function MyComponent({ value }) {
  useEffect(() => {
    doSomething(value); // ❌ `value` is used but not in the dependency array
  }, []); // Missing dependency: `value`
  // This will only run once and won't update when `value` changes
}

// GOOD: All dependencies included
function MyComponent({ value }) {
  useEffect(() => {
    doSomething(value);
  }, [value]); // ✅ `value` is included in the deps array
  // This will re-run whenever `value` changes
}

// BAD: Unnecessary dependency
function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = 'You clicked ' + count + ' times';
  }, [count, setCount]); // ❌ `setCount` is unnecessary
  // Setter functions from useState are stable and don't need to be in the deps array
}

// GOOD: Only necessary dependencies included
function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = 'You clicked ' + count + ' times';
  }, [count]); // ✅ Only `count` is included
}

// Complex Example: Handling Function Dependencies
function MyComponent({ fetchData }) {
  // BAD: Recreating function on every render
  useEffect(() => {
    const processedData = fetchData().then(data => {
      // Process data
    });
  }, []); // ❌ This will cause a lint warning

  // GOOD: Using useCallback to memoize the function
  const memoizedFetchData = useCallback(() => {
    return fetchData().then(data => {
      // Process data
    });
  }, [fetchData]); // ✅ Depends on the external `fetchData` function

  useEffect(() => {
    memoizedFetchData();
  }, [memoizedFetchData]); // ✅ Depends on the memoized function
}
```

### Best Practices and Recommendations

1. **Always Include All Dependencies**
   - If a value is used inside a Hook, it should be in the dependency array.
   - Use `useCallback` and `useMemo` to memoize functions and values that don't need to be recreated on every render.

2. **Be Explicit About Dependencies**
   - Prefer explicitly listing dependencies over using the exhaustive-deps rule's auto-fix.
   - If a dependency is truly not needed, you can disable the lint rule for that specific line, but document why.

3. **Consider Performance**
   - While including all dependencies is important, be mindful of performance.
   - For expensive computations, use `useMemo` to memoize results.
   - For functions, use `useCallback` to prevent unnecessary re-renders.

4. **Custom Hooks**
   - Apply the same rules to custom Hooks as you would to built-in Hooks.
   - Ensure that custom Hooks follow the Rules of Hooks.

### Conclusion

The React Hooks Rules are designed to help you write more predictable and maintainable React code. By following these rules and leveraging the linter, you can prevent common pitfalls and create more robust React applications.

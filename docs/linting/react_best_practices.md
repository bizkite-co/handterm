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

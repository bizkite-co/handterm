# Type Safety Strategies for Preventing Subtle Type Bugs

## Systematic Approach to Type Checking

### 1. Type Guards and Narrowing

```typescript
// Type guard for non-empty strings
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// Type guard for valid numbers
function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

// Example usage
function processInput(input: string | null | undefined) {
  if (isNonEmptyString(input)) {
    // Guaranteed to be a non-empty string here
    console.log(input.toUpperCase());
  }
}
```

### 2. Explicit Null and Undefined Checks

```typescript
// Comprehensive null/undefined check
function hasValue<T>(value: T | null | undefined): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// Safe property access
function getPropertySafely<T, K extends keyof T>(
  obj: T | null | undefined,
  property: K
): T[K] | null {
  return obj && obj[property] !== undefined ? obj[property] : null;
}
```

### 3. Recommended ESLint Configuration

```javascript
'@typescript-eslint/strict-boolean-expressions': ['error', {
  allowString: false,     // Require explicit string length check
  allowNumber: false,     // Require explicit number validation
  allowNullableObject: false,  // Require explicit null checks
  allowNullableBoolean: false, // Require explicit boolean checks
  allowNullableString: false,
  allowNullableNumber: false,
  allowAny: false
}]
```

### 4. Pattern for Safe Conditional Logic

```typescript
// Safe number processing
function processPrice(price: number | null | undefined) {
  // Explicit checks for null, undefined, and zero
  if (hasValue(price) && price !== 0) {
    return calculateTotalPrice(price);
  }
  return null;
}

// Safe object property access
function getUserName(user: User | null | undefined) {
  const name = getPropertySafely(user, 'name');
  return name ? name.trim() : 'Anonymous';
}
```

## Best Practices

1. **Always Use Explicit Checks**
   - Avoid truthy/falsy comparisons
   - Explicitly check for null, undefined, and specific value conditions

2. **Leverage Type Narrowing**
   - Use type guards to refine type information
   - Create custom type guard functions for complex checks

3. **Provide Default Values**
   - Use nullish coalescing (`??`) for default values
   - Create safe accessor functions

4. **Configure ESLint Strictly**
   - Enable strict type checking rules
   - Customize rules to match project needs

## Common Pitfalls to Avoid

- Relying on implicit type coercion
- Using `!!` for boolean conversions
- Skipping null/undefined checks
- Assuming type safety without explicit validation

## Performance Considerations

While these strategies add some overhead, they:
- Prevent runtime errors
- Improve code reliability
- Make type-related bugs immediately apparent
- Provide clear documentation through type checks

## Recommended Tools

- TypeScript Compiler
- ESLint with strict TypeScript rules
- Typescript-eslint plugin
- IDE type checking extensions

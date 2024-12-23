# Subtle Type-Related Bugs in JavaScript/TypeScript

## 1. Falsy Value Confusion

### Example 1: String Input Processing
```typescript
function processUserInput(input: string | null) {
  // Bug: '0' is a valid string, but would be treated as falsy
  if (input) {
    console.log(input.toUpperCase()); // Might silently fail for '0'
  }
}
```

### Example 2: Numeric Calculations
```typescript
function calculateTotal(price: number | null) {
  // Dangerous: 0 is a valid price, but would be treated as falsy
  if (price) {
    return price * 1.1; // Incorrectly skips 0 price items
  }
}
```

## 2. Nullable Object Property Access

### Example: User Data Handling
```typescript
interface User {
  name?: string;
  age?: number;
}

function greetUser(user: User) {
  // Risky: empty string or 0 would be treated as falsy
  if (user.name) {
    console.log(`Hello, ${user.name}`); // Might miss valid but "falsy" names
  }
}
```

## 3. Boolean Flag Mishandling

### Example: Settings Configuration
```typescript
interface Settings {
  notifications?: boolean;
}

function configureNotifications(settings: Settings) {
  // Dangerous: false is a valid boolean value
  if (settings.notifications) {
    enableNotifications(); // Would incorrectly skip explicitly disabled notifications
  }
}
```

## 4. Array Length Checks

### Example: Item Processing
```typescript
function processItems(items: string[]) {
  // Potential issue: empty array is falsy
  if (items) {
    items.forEach(item => processItem(item)); // Would incorrectly skip empty arrays
  }
}
```

## Consequences of Implicit Type Coercion

These examples demonstrate how implicit type coercion can lead to:
- Skipping valid zero values
- Incorrectly handling empty strings
- Misinterpreting boolean flags
- Silently ignoring empty collections

## Recommended Explicit Checks

```typescript
// Instead of implicit checks:
if (input) { ... }

// Use explicit type checks:
if (input !== null && input !== undefined && input.length > 0) { ... }

// For numbers:
if (price !== null && price !== undefined && price !== 0) { ... }

// For boolean flags:
if (settings.notifications === true) { ... }
```

## Benefits of Explicit Checking

1. Prevents accidental type coercion
2. Eliminates silent failures
3. Makes intent clearer
4. Reduces unexpected runtime behavior
5. Improves overall code predictability

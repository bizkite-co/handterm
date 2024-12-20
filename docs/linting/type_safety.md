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

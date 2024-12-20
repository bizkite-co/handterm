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

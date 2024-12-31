
## Testing Standards

### Browser APIs in Tests
When testing code that uses browser APIs, always import the necessary polyfills instead of relying on global browser APIs. This ensures tests run consistently across different environments.

```typescript
// BAD: Using global browser API
const imageData = new ImageData(1, 1);

// GOOD: Importing from polyfill
import { ImageData } from 'canvas';
const imageData = new ImageData(1, 1);
```

The following rule enforces this pattern:
```typescript
'no-restricted-globals': [
  'error',
  {
    name: 'ImageData',
    message: 'Import ImageData from the canvas package instead of using the global browser API'
  }
]
```

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

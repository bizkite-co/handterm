## Naming Conventions

### Core Rules
```typescript
'@typescript-eslint/naming-convention': [
  'error',
  {
    selector: 'default',
    format: ['camelCase'],
    leadingUnderscore: 'forbid',
    trailingUnderscore: 'forbid',
  },
  // Additional configurations for different types
]
```

### Rationale
- Consistent naming improves readability
- Different cases convey different meanings
- No leading underscores (except in very specific cases)

### Examples

```typescript
// BAD: Inconsistent naming
const user_data = getData();
const APIEndpoint = '/api';
const _privateVar = 'hidden';

// GOOD: Consistent naming
const userData = getData();
const API_ENDPOINT = '/api';
const privateVar = 'hidden';

// GOOD: React components in PascalCase
function UserProfile(): JSX.Element {
  return <div>Profile</div>;
}

// GOOD: Event handlers
function handleClick(): void {
  // ...
}

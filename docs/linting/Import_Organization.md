## Import Organization

### Core Rules
```typescript
'import/order': ['error', {
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
  'newlines-between': 'always',
  // Additional configurations
}],
'import/no-default-export': 'error',
```

### Rationale
- Organized imports improve readability
- Named exports are more refactoring-friendly
- Clear separation between different types of imports

### Examples

```typescript
// GOOD: Organized imports
import React, { useState } from 'react';

import { signal } from '@preact/signals-react';
import { QueryClient } from '@tanstack/react-query';

import { useAuth } from 'hooks/useAuth' (see below for file content);
import { Button } from 'components/Button' (see below for file content);

import { type User } from './types';
import { formatDate } from './utils';

// BAD: Default exports
export default function Component() {}

// GOOD: Named exports
export function Component(): JSX.Element {}

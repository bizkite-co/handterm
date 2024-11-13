# Jest DOM Matcher Type Resolution Issues

## Problem Description
We're encountering issues with jest-dom matchers not being properly extended in our test environment:

```
TypeError: Cannot read properties of undefined (reading 'extend')
```

This error occurs when trying to use jest-dom matchers in our tests, indicating a problem with how the matchers are being loaded and extended onto Jest's expect function.

## Technical Details

### Setup File Issues
We've tried multiple approaches to set up jest-dom:

1. CommonJS Setup (jest-setup.cjs):
```javascript
const matchers = require('@testing-library/jest-dom/matchers');
const expect = require('expect');

Object.keys(matchers)
  .filter(key => key !== 'default')
  .forEach(key => {
    expect.extend({
      [key]: matchers[key]
    });
  });
```

2. TypeScript Setup (jest-setup.ts):
```typescript
import '@testing-library/jest-dom';
```

3. Direct Import in Tests:
```typescript
import '@testing-library/jest-dom/extend-expect';
```

### Configuration Attempts

1. Using setupFilesAfterEnv:
```javascript
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts']
};
```

2. Using setupFiles:
```javascript
module.exports = {
  setupFiles: ['<rootDir>/jest-setup.cjs']
};
```

3. Trying different module resolution settings:
```javascript
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  }
};
```

## Root Cause Analysis
The issue appears to stem from:
1. Module system conflicts (ESM vs CommonJS)
2. Timing of when expect is available in the Jest environment
3. How jest-dom matchers are being loaded and extended

## Current Status
Still experiencing issues with:
1. expect.extend not being available when matchers are loaded
2. Type definitions not being properly recognized
3. Module resolution conflicts affecting matcher loading

## Next Steps
1. Investigate using Jest's globalSetup option
2. Consider alternative approaches to extending matchers
3. Review jest-dom documentation for ESM-specific setup
4. Consider creating a custom matcher setup solution that works with our module system

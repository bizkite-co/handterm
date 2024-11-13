# Jest Configuration Troubleshooting

## Overview
We're working to resolve several interrelated issues with Jest configuration in our React TypeScript project:

1. Module resolution (ESM vs CommonJS)
2. Jest-dom matcher extension
3. TypeScript path aliases
4. Test file transformation

## Attempted Solutions

### 1. Custom Module Resolution

#### Initial Approach
Created moduleResolver.cjs to handle path resolution:
```javascript
module.exports = (request, options) => {
  if (request.startsWith('src/')) {
    const relativePath = request.substring(4);
    const absolutePath = path.resolve(options.rootDir, 'src', relativePath);
    return tryExtensions(absolutePath);
  }
  return options.defaultResolver(request, options);
};
```

#### Results
- ✅ Successfully resolves 'src/' prefixed imports
- ❌ Still having issues with ESM/CommonJS interop
- ❌ Some node_modules not properly transformed

### 2. Jest-Dom Setup

#### First Attempt (CommonJS)
```javascript
// jest-setup.cjs
const matchers = require('@testing-library/jest-dom/matchers');
const expect = require('expect');
expect.extend(matchers);
```

#### Second Attempt (TypeScript)
```typescript
// jest-setup.ts
import '@testing-library/jest-dom';
```

#### Results
- ❌ expect.extend not available
- ❌ Type errors with matcher extension
- ❌ Module system conflicts

### 3. Jest Configuration Evolution

#### Initial Config
```javascript
module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts']
};
```

#### Current Config
```javascript
module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        moduleResolution: 'node',
        baseUrl: '.',
        paths: {
          'src/*': ['src/*']
        }
      }
    }]
  },
  moduleDirectories: ['node_modules', '.', 'src'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts']
};
```

## Current Issues

### Module Resolution
```
Cannot find module 'src/signals/commandLineSignals' from 'src/game/useBaseCharacter.tsx'
```

### Jest-Dom Matchers
```
TypeError: Cannot read properties of undefined (reading 'extend')
```

### ESM/CommonJS Conflicts
```
Error [ERR_REQUIRE_ESM]: require() of ES Module not supported
```

## Next Steps

1. **Module Resolution**
   - Consider migrating to relative imports
   - Evaluate alternative module resolution strategies
   - Review project's module system configuration

2. **Jest-Dom Setup**
   - Investigate Jest's globalSetup option
   - Review jest-dom documentation for ESM setup
   - Consider custom matcher setup solution

3. **Configuration**
   - Simplify Jest configuration
   - Focus on one module system
   - Document working configuration patterns

## Lessons Learned

1. **Module Systems**
   - Mixing ESM and CommonJS creates complexity
   - Need consistent approach across project
   - Consider module system during dependency selection

2. **Test Setup**
   - Setup files need careful ordering
   - Module transformation crucial for modern JS
   - Type definitions require special attention

3. **Configuration**
   - Start simple, add complexity as needed
   - Document configuration changes
   - Test configuration changes incrementally

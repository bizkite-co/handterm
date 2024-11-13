# Jest Configuration Challenges

## Problem
We encountered several issues with Jest configuration in our React TypeScript project:

1. Module resolution conflicts between ESM and CommonJS
2. Issues with jest-dom matchers not being properly extended
3. Problems with absolute imports using 'src/' prefix
4. Conflicts between TypeScript paths and Jest module resolution

## Attempted Solutions

### Custom Module Resolver
Created a custom module resolver (moduleResolver.cjs) to handle:
- Resolution of 'src/' prefixed imports
- File extension resolution (.ts, .tsx, etc.)
- ESM to CommonJS conversion for certain modules

```javascript
// moduleResolver.cjs
const path = require('path');
const fs = require('fs');

// List of extensions to try
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

function tryExtensions(basePath) {
  // First try exact path
  if (fs.existsSync(basePath)) {
    return basePath;
  }

  // Try with each extension
  for (const ext of extensions) {
    const pathWithExt = basePath + ext;
    if (fs.existsSync(pathWithExt)) {
      return pathWithExt;
    }
  }

  return null;
}
```

### Jest Setup File
Tried multiple approaches for setting up jest-dom:
1. CommonJS setup file (jest-setup.cjs)
2. TypeScript setup file (jest-setup.ts)
3. Direct import of @testing-library/jest-dom

### Jest Configuration
Experimented with various Jest configuration options:
1. Using ts-jest preset with custom transformation settings
2. Configuring module resolution paths
3. Setting up proper TypeScript compilation options

```javascript
// jest.config.cjs
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
  }
}
```

## Current Status
Still working to resolve:
1. jest-dom matcher extension issues
2. Module resolution for absolute imports
3. ESM/CommonJS compatibility

Next steps:
1. Further investigate jest-dom setup in ESM context
2. Consider alternative approaches to module resolution
3. Review TypeScript configuration for potential conflicts

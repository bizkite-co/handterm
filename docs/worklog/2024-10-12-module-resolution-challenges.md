# Module Resolution Challenges

## Problem Description
Our project uses a mix of ESM and CommonJS modules, leading to several challenges:

1. Absolute imports using 'src/' prefix not being resolved
2. Conflicts between TypeScript path aliases and Jest module resolution
3. ESM modules in node_modules not being properly transformed

## Technical Details

### Import Path Resolution
The project uses TypeScript path aliases configured in tsconfig.json:
```json
{
  "paths": {
    "src/*": ["src/*"]
  }
}
```

However, these paths aren't automatically respected by Jest, leading to module resolution errors like:
```
Cannot find module 'src/signals/commandLineSignals' from 'src/game/useBaseCharacter.tsx'
```

### ESM vs CommonJS
The project is configured as an ESM project (type: "module" in package.json), but some dependencies and test files expect CommonJS. This leads to conflicts:

1. Jest configuration files must use .cjs extension
2. Some node_modules need to be transformed from ESM to CommonJS
3. Test setup files need special handling for module systems

## Attempted Solutions

### Custom Module Resolver
Implemented a custom module resolver to handle:
1. Path resolution for 'src/' prefixed imports
2. File extension resolution
3. ESM to CommonJS conversion for certain modules

```javascript
const path = require('path');
const fs = require('fs');

module.exports = (request, options) => {
  // Handle src/ prefix
  if (request.startsWith('src/')) {
    const relativePath = request.substring(4);
    const absolutePath = path.resolve(options.rootDir, 'src', relativePath);
    const resolvedPath = tryExtensions(absolutePath);

    if (resolvedPath) {
      return resolvedPath;
    }
  }

  // Handle ESM modules
  return options.defaultResolver(request, {
    ...options,
    packageFilter: pkg => {
      if (pkg.type === 'module') {
        delete pkg.type;
        if (pkg.exports) {
          pkg.main = pkg.exports.require || pkg.exports.default;
        }
      }
      return pkg;
    }
  });
};
```

### Jest Configuration
Updated Jest configuration to handle module resolution:
1. Added custom resolver
2. Configured transformIgnorePatterns for ESM modules
3. Set up proper module directories and extensions

```javascript
module.exports = {
  moduleDirectories: ['node_modules', '.', 'src'],
  transformIgnorePatterns: [
    'node_modules/(?!(@preact|@testing-library)/)'
  ],
  moduleFileExtensions: [
    'ts', 'tsx', 'js', 'jsx', 'json', 'node', 'cjs'
  ]
};
```

## Current Status
Still working to resolve:
1. Consistent module resolution across all import types
2. Proper handling of ESM dependencies in tests
3. TypeScript path alias resolution in Jest environment

## Next Steps
1. Consider migrating all test files to use relative imports
2. Evaluate alternative module resolution strategies
3. Review and possibly update project's module system configuration
4. Consider creating a custom Jest transformer for handling mixed module systems

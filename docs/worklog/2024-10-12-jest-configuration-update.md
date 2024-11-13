# Jest Configuration Update

## Latest Configuration Attempts

### 1. TypeScript-First Approach

Moved from babel-jest to ts-jest for better TypeScript support:

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
      },
      isolatedModules: true,
      diagnostics: false
    }]
  }
};
```

### 2. Jest Setup Evolution

Tried multiple approaches for test setup:

1. CommonJS Version:
```javascript
// jest-setup.cjs
require('@testing-library/jest-dom');
```

2. TypeScript Version:
```typescript
// jest-setup.ts
import '@testing-library/jest-dom';
```

3. Configuration Changes:
```javascript
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts']
};
```

### 3. Module Resolution Strategy

Updated module resolution to handle both ESM and CommonJS:

```javascript
moduleDirectories: ['node_modules', '.', 'src'],
moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'cjs'],
transformIgnorePatterns: [
  'node_modules/(?!(@preact|@testing-library)/)'
]
```

## Current Challenges

### 1. Jest-Dom Integration
- expect.extend not available during setup
- Type definition conflicts
- Module system incompatibilities

### 2. Path Resolution
- Absolute imports not consistently resolved
- TypeScript path aliases not fully respected
- Module resolution conflicts between test and source files

### 3. ESM/CommonJS Interop
- Mixed module systems causing conflicts
- Some dependencies requiring specific module system
- Test setup files affected by module system differences

## Impact Analysis

### What's Working
- Basic TypeScript compilation
- React component transformation
- Some module resolution through custom resolver

### What's Not Working
- Jest-dom matcher extension
- Consistent module resolution
- Clean ESM/CommonJS interop

## Next Iteration Plan

### Short-term Fixes
1. Simplify test setup to minimal configuration
2. Focus on one module system consistently
3. Document working patterns for future reference

### Long-term Solutions
1. Consider migrating to pure ESM
2. Evaluate alternative testing frameworks
3. Review project architecture for testing improvements

## Configuration Evolution

### Previous
```javascript
module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { modules: 'commonjs' }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  }
};
```

### Current
```javascript
module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        moduleResolution: 'node'
      },
      useESM: true
    }]
  }
};
```

## Lessons Learned
1. Start with simpler configuration and add complexity as needed
2. Test configuration changes incrementally
3. Document all configuration attempts and their outcomes
4. Consider module system implications early in setup
5. Pay attention to the order of setup files and transformations

## Future Considerations
1. Evaluate Jest alternatives that better handle ESM
2. Consider project-wide module system standardization
3. Review testing strategy for simpler configuration needs
4. Document successful patterns for team reference

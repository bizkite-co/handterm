# Jest Configuration Base Document

## Core Configuration Structure

Our Jest configuration is built around several key areas:

### 1. Base Configuration
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  moduleDirectories: ['node_modules', '.', 'src']
};
```

### 2. Module Resolution
```javascript
{
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  resolver: '<rootDir>/moduleResolver.cjs',
  moduleFileExtensions: [
    'ts', 'tsx', 'js', 'jsx', 'json', 'node', 'cjs'
  ]
}
```

### 3. TypeScript Configuration
```javascript
{
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        baseUrl: '.',
        paths: {
          'src/*': ['src/*']
        }
      }
    }
  }
}
```

### 4. Transform Configuration
```javascript
{
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      isolatedModules: true,
      diagnostics: false
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@preact|@testing-library)/)'
  ]
}
```

## Key Components

### 1. Custom Module Resolver
- Handles 'src/' prefixed imports
- Manages file extension resolution
- Converts ESM to CommonJS when needed

### 2. Test Setup
- Jest-dom configuration
- Global test utilities
- Environment preparation

### 3. TypeScript Integration
- Path alias resolution
- Type checking in tests
- JSX/TSX transformation

## Configuration Principles

### 1. Module System Handling
- Consistent approach to ESM/CommonJS
- Clear transformation rules
- Proper module resolution

### 2. TypeScript Support
- Full type checking in tests
- Path alias support
- Proper JSX/TSX handling

### 3. Test Environment
- Browser-like environment (jsdom)
- Proper DOM testing utilities
- Consistent mocking capabilities

## Testing Standards

### 1. File Organization
```
src/
  __tests__/          # Test files
  __mocks__/          # Mock files
  components/
    __tests__/        # Component-specific tests
  hooks/
    __tests__/        # Hook-specific tests
```

### 2. Naming Conventions
- Test files: `*.test.ts(x)` or `*.spec.ts(x)`
- Mock files: Match source file name
- Test utilities: `*.test.utils.ts`

### 3. Mock Organization
```
__mocks__/
  @preact/
    signals-react.ts
  signals/
    appSignals.ts
    commandLineSignals.ts
    tutorialSignals.ts
```

## Best Practices

### 1. Module Resolution
- Use consistent import styles
- Prefer relative imports when possible
- Document path alias usage

### 2. Test Setup
- Keep setup files focused
- Document setup requirements
- Use appropriate setup hooks

### 3. Configuration Management
- Document configuration changes
- Test configuration updates
- Keep configuration DRY

## Common Issues and Solutions

### 1. Module Resolution
- Use custom resolver for complex cases
- Document module system requirements
- Handle ESM/CommonJS conflicts explicitly

### 2. TypeScript Integration
- Ensure proper tsconfig settings
- Handle path aliases consistently
- Manage type definitions properly

### 3. Test Environment
- Configure jsdom appropriately
- Handle browser APIs properly
- Mock external dependencies consistently

## Maintenance Guidelines

### 1. Configuration Updates
- Document changes in worklog
- Test configuration changes
- Update documentation

### 2. Dependency Management
- Track Jest-related dependencies
- Handle peer dependencies
- Manage version conflicts

### 3. Testing Infrastructure
- Regular configuration review
- Performance monitoring
- Test coverage maintenance

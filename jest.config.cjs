module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // Ensure testing libraries and globals are loaded
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],

  // Module resolution and mapping
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Explicitly map signal imports
    '^src/signals/(.*)$': '<rootDir>/src/signals/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    // Explicitly map testing library imports
    '@testing-library/jest-dom/matchers': '@testing-library/jest-dom/matchers',
    // Handle ES module imports
    '^@preact/signals-react$': '@preact/signals-react/dist/signals.module.js',
    '^@preact/signals-react/(.*)$': '@preact/signals-react/dist/$1'
  },

  // Transformation settings
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      babelConfig: true,
      useESM: true
    }]
  },

  // Ignore specific node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@preact/signals-react|@testing-library|src/)/)'
  ],

  // Test file matching
  testMatch: [
    '**/__tests__/**/*.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ],

  // File extensions to process
  moduleFileExtensions: [
    'ts', 'tsx', 'js', 'jsx', 'json', 'node'
  ],

  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],

  // Verbose logging for diagnostics
  verbose: true,

  // Global configuration for Jest
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true
      },
      useESM: true
    }
  },

  // Enable ES Modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Ensure mocks can be resolved
  modulePaths: ['<rootDir>/src', '<rootDir>/src/signals']
};

const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // Module resolution and mapping
  moduleNameMapper: {
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },

  // Custom resolver
  resolver: '<rootDir>/moduleResolver.js',

  // Transformation settings
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs'
        }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },

  // Transform node_modules that use ESM
  transformIgnorePatterns: [
    'node_modules/(?!(@preact|@testing-library)/)'
  ],

  // Test file matching
  testMatch: [
    '**/__tests__/**/*.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],

  // Module file extensions
  moduleFileExtensions: [
    'ts', 'tsx', 'js', 'jsx', 'json', 'node'
  ],

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost'
  },

  // Module resolution settings
  moduleDirectories: ['node_modules', '.'],
  roots: ['<rootDir>'],

  // TypeScript settings
  globals: {
    'ts-jest': {
      tsconfig: {
        baseUrl: '.',
        paths: {
          'src/*': ['src/*']
        },
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node'
      }
    }
  }
};

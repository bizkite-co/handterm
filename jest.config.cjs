const path = require('path');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest/presets/default-esm', // Use ESM preset

  // Module resolution and mapping
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },

  // Custom resolver for mixed module systems
  resolver: '<rootDir>/moduleResolver.cjs',

  // Transformation settings
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        baseUrl: '.',
        paths: {
          'src/*': ['src/*']
        }
      },
      useESM: true // Enable ESM support
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
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],

  // Module file extensions
  moduleFileExtensions: [
    'ts', 'tsx', 'js', 'jsx', 'json', 'node', 'cjs', 'mjs'
  ],

  // Test environment options
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost'
  },

  // Module resolution settings
  moduleDirectories: ['node_modules', '.'],
  roots: ['<rootDir>'],

  // Enable ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Global settings
  globals: {
    'ts-jest': {
      useESM: true,
      isolatedModules: true
    }
  }
};

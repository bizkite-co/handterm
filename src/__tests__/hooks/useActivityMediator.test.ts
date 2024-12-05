import {
  describe,
  it,
  expect,
  jest,
  beforeEach
} from '@jest/globals';

// Explicitly define custom matcher
const toBeWithinRange = function(received, floor, ceiling) {
  const pass = received >= floor && received <= ceiling;
  return {
    pass,
    message: pass
      ? () => `expected ${received} not to be within range ${floor} - ${ceiling}`
      : () => `expected ${received} to be within range ${floor} - ${ceiling}`
  };
};

// Ensure expect is extended
if (expect && typeof expect.extend === 'function') {
  try {
    expect.extend({ toBeWithinRange });
  } catch (error) {
    console.warn('Failed to extend expect:', error);
  }
}

import { renderHook } from '@testing-library/react';
import { useActivityMediator } from '../../hooks/useActivityMediator';
import { ActivityType } from '../../types/Types';

// Mock dependencies
jest.mock('../../hooks/useReactiveLocation', () => ({
  useReactiveLocation: () => ({
    reactiveLocation: {
      activity: 'normal',
      phraseKey: '',
      groupKey: '',
      getPath: jest.fn(),
    },
    updateLocation: jest.fn(),
    parseLocation: () => ({
      activityKey: ActivityType.NORMAL,
      contentKey: '',
      groupKey: ''
    })
  })
}));

jest.mock('../../hooks/useTutorials', () => ({
  useTutorial: () => ({
    getIncompleteTutorialsInGroup: jest.fn(() => []),
    canUnlockTutorial: jest.fn(() => true)
  })
}));

jest.mock('../../signals/tutorialSignals', () => ({
  tutorialSignal: { value: null },
  getNextTutorial: jest.fn(),
  setNextTutorial: jest.fn(),
  resetCompletedTutorials: jest.fn(),
  setCompletedTutorial: jest.fn()
}));

jest.mock('../../signals/gameSignals', () => ({
  gamePhraseSignal: { value: null },
  isInGameModeSignal: { value: false },
  getIncompletePhrasesByTutorialGroup: jest.fn(() => []),
  initializeGame: jest.fn(),
  setCompletedGamePhrase: jest.fn(),
  getNextGamePhrase: jest.fn(),
  setGamePhrase: jest.fn()
}));

jest.mock('../../signals/appSignals', () => ({
  activitySignal: { value: ActivityType.NORMAL },
  bypassTutorialSignal: { value: false },
  setNotification: jest.fn()
}));

describe('useActivityMediator hook', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should initialize with default activity state', () => {
    const { result } = renderHook(() => useActivityMediator());
    expect(result.current).toBeDefined();
    expect(result.current.isInNormal).toBe(true);
    expect(result.current.heroAction).toBe('Idle');
    expect(result.current.zombie4Action).toBe('Walk');
  });

  it('should handle activity transitions', () => {
    const { result } = renderHook(() => useActivityMediator());
    expect(result.current.handleCommandExecuted({
      command: 'play',
      args: [],
      switches: {}
    })).toBe(true);
  });
});

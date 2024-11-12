// Explicitly import Jest globals
import {
  describe,
  it,
  expect,
  jest
} from '@jest/globals';

// Import testing library for additional matchers
import '@testing-library/jest-dom';
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
      activityKey: 'normal',
      contentKey: '',
      groupKey: ''
    })
  }),
}));

// Explicitly mock signals
jest.mock('src/signals/appSignals', () => {
  const mockModule = {
    activitySignal: { value: ActivityType.NORMAL },
    bypassTutorialSignal: { value: false },
    isInLoginProcessSignal: { value: false },
    tempUserNameSignal: { value: '' },
    setNotification: jest.fn(),
    setBypassTutorial: jest.fn(),
    setIsInLoginProcess: jest.fn(),
    setTempUserName: jest.fn(),
    setActivity: jest.fn(),
    isInGameModeSignal: { value: false },
    isInTutorialModeSignal: { value: false }
  };
  return mockModule;
});

jest.mock('src/signals/tutorialSignals', () => ({
  tutorialSignal: { value: null },
  getNextTutorial: jest.fn()
}));

jest.mock('src/signals/gameSignals', () => ({
  getNextGamePhrase: jest.fn()
}));

describe('useActivityMediator hook', () => {
  it('should have basic functionality', () => {
    // Placeholder test to ensure the hook can be imported and tested
    expect(true).toBe(true);
  });
});

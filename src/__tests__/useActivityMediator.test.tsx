// Explicitly import Jest globals at the top of the file
import {
  describe,
  it,
  expect,
  jest
} from '@jest/globals';

import React from 'react';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useActivityMediator } from '../hooks/useActivityMediator';
import { ActivityType } from '../types/Types';

// Mock dependencies to avoid router conflicts
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(() => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: ''
  }))
}));

// Mock the useReactiveLocation hook
jest.mock('../hooks/useReactiveLocation', () => ({
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

describe('useActivityMediator', () => {
  it('should update reactiveLocation when activity changes', () => {
    const { result } = renderHook(() => useActivityMediator());

    act(() => {
      result.current.handleCommandExecuted({
        command: 'play',
        args: [],
        switches: {}
      });
    });

    expect(result.current.isInGameMode).toBe(true);

    act(() => {
      result.current.handleCommandExecuted({
        command: 'tut',
        args: [],
        switches: {}
      });
    });

    expect(result.current.isInTutorial).toBe(true);

    act(() => {
      result.current.handleCommandExecuted({
        command: 'edit',
        args: ['testFile'],
        switches: {}
      });
    });

    expect(result.current.isInEdit).toBe(true);
  });
});

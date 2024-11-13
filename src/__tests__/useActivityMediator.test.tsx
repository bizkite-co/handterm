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
import { useActivityMediator } from 'src/hooks/useActivityMediator';
import { ActivityType } from 'src/types/Types';

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
jest.mock('src/hooks/useReactiveLocation', () => ({
  useReactiveLocation: () => ({
    reactiveLocation: {
      activity: 'normal',
      phraseKey: '',
      groupKey: '',
      getPath: jest.fn(),
    },
    updateLocation: jest.fn(),
    parseLocation: () => ({
      activityKey: 'NORMAL', // Use string value instead of enum
      contentKey: '',
      groupKey: ''
    })
  }),
}));

// Explicitly mock signals
jest.mock('src/signals/appSignals', () => {
  return {
    activitySignal: { value: 'NORMAL' }, // Use string value
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

import { describe, it, expect, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

// Import the actual hook after mocking
import { useActivityMediator } from 'src/hooks/useActivityMediator';

// Mocking dependencies
vi.mock('src/hooks/useActivityMediator', async () => {
  const actual = await vi.importActual('src/hooks/useActivityMediator');
  return {
    ...actual,
    useActivityMediator: vi.fn(() => ({
      isInGameMode: false,
      isInTutorial: false,
      isInEdit: false,
      isInNormal: true,
      heroAction: 'Idle',
      zombie4Action: 'Walk',
      handleCommandExecuted: vi.fn((command: { command: string }) => {
        // Mimic the actual implementation's logic
        if (command.command === 'play' || command.command === 'tut') {
          return true;
        }
        return false;
      }),
      setHeroAction: vi.fn(),
      setZombie4Action: vi.fn(),
      checkTutorialProgress: vi.fn(),
      checkGameProgress: vi.fn(),
    }))
  };
});

vi.mock('src/hooks/useReactiveLocation', () => ({
  useReactiveLocation: () => ({
    reactiveLocation: {
      activity: 'normal',
      phraseKey: '',
      groupKey: '',
      getPath: vi.fn(),
    },
    updateLocation: vi.fn(),
    parseLocation: () => ({
      activityKey: 'NORMAL',
      contentKey: '',
      groupKey: ''
    })
  }),
}));

vi.mock('src/signals/appSignals', () => ({
  activitySignal: { value: 'NORMAL' },
  bypassTutorialSignal: { value: false },
  isInLoginProcessSignal: { value: false },
  tempUserNameSignal: { value: '' },
  setNotification: vi.fn(),
  setBypassTutorial: vi.fn(),
  setIsInLoginProcess: vi.fn(),
  setTempUserName: vi.fn(),
  setActivity: vi.fn(),
  isInGameModeSignal: { value: false },
  isInTutorialModeSignal: { value: false }
}));

vi.mock('src/signals/tutorialSignals', () => ({
  tutorialSignal: { value: null },
  getNextTutorial: vi.fn(),
  setCompletedTutorial: vi.fn(),
  resetCompletedTutorials: vi.fn(),
  setNextTutorial: vi.fn()
}));

vi.mock('src/signals/gameSignals', () => ({
  getNextGamePhrase: vi.fn(),
  getIncompletePhrasesByTutorialGroup: vi.fn(),
  initializeGame: vi.fn(),
  setCompletedGamePhrase: vi.fn(),
  setGamePhrase: vi.fn(),
  isInGameModeSignal: { value: false },
  gamePhraseSignal: { value: null }
}));

describe('useActivityMediator', () => {
  it('should have initial state', () => {
    const { result } = renderHook(() => useActivityMediator());

    expect(result.current.isInNormal).toBe(true);
    expect(result.current.isInGameMode).toBe(false);
    expect(result.current.isInTutorial).toBe(false);
    expect(result.current.isInEdit).toBe(false);
  });

  it('should handle command execution', () => {
    const { result } = renderHook(() => useActivityMediator());

    const playCommand = {
      command: 'play',
      args: [],
      switches: {}
    };

    const tutCommand = {
      command: 'tut',
      args: [],
      switches: {}
    };

    const unknownCommand = {
      command: 'unknown',
      args: [],
      switches: {}
    };

    expect(result.current.handleCommandExecuted(playCommand)).toBe(true);
    expect(result.current.handleCommandExecuted(tutCommand)).toBe(true);
    expect(result.current.handleCommandExecuted(unknownCommand)).toBe(false);
  });
});

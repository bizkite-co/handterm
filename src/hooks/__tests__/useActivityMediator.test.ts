/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { useActivityMediator } from '../useActivityMediator'
import { tutorialSignal, setCompletedTutorial } from '../signals/tutorialSignals';
import { setCompletedGamePhrase } from '../signals/gameSignals';
import { ActivityType, ParsedCommand } from '../types/Types';
import { setActivity } from '../signals/appSignals';

// Mock the signals
jest.mock('../signals/tutorialSignals', () => ({
  tutorialSignal: { value: null },
  setCompletedTutorial: jest.fn(),
  getNextTutorial: jest.fn(),
}));

jest.mock('../signals/gameSignals', () => ({
  setCompletedGamePhrase: jest.fn(),
  getNextGamePhrase: jest.fn(),
}));

jest.mock('../signals/appSignals', () => ({
  setActivity: jest.fn(),
}));

describe('useActivityMediator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('checkTutorialProgress completes tutorial on correct command', () => {
    tutorialSignal.value = { phrase: ['test'], tutorialGroup: 'group1' };
    const { result } = renderHook(() => useActivityMediator({}));

    act(() => {
      result.current.checkTutorialProgress('test');
    });

    expect(setCompletedTutorial).toHaveBeenCalledWith('test');
  });

  test('checkTutorialProgress does not complete tutorial on incorrect command', () => {
    tutorialSignal.value = { phrase: ['test'], tutorialGroup: 'group1' };
    const { result } = renderHook(() => useActivityMediator({}));

    act(() => {
      result.current.checkTutorialProgress('wrong');
    });

    expect(setCompletedTutorial).not.toHaveBeenCalled();
  });

  test('checkGameProgress completes game phrase', () => {
    const { result } = renderHook(() => useActivityMediator({}));

    act(() => {
      result.current.checkGameProgress({ key: 'phrase1', value: 'test phrase', tutorialGroup: 'group1' });
    });

    expect(setCompletedGamePhrase).toHaveBeenCalledWith('phrase1');
  });

  test('handleCommandExecuted changes activity to GAME on "play" command', () => {
    const { result } = renderHook(() => useActivityMediator({}));

    const parsedCommand: ParsedCommand = { command: 'play', args: [], switches: {} };
    
    act(() => {
      result.current.handleCommandExecuted(parsedCommand);
    });

    expect(setActivity).toHaveBeenCalledWith(ActivityType.GAME);
  });

  test('handleCommandExecuted changes activity to TUTORIAL on "tut" command', () => {
    const { result } = renderHook(() => useActivityMediator({}));

    const parsedCommand: ParsedCommand = { command: 'tut', args: [], switches: {} };
    
    act(() => {
      result.current.handleCommandExecuted(parsedCommand);
    });

    expect(setActivity).toHaveBeenCalledWith(ActivityType.TUTORIAL);
  });
});
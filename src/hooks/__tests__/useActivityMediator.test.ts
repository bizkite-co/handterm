/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useActivityMediator, ActivityType } from '../useActivityMediator';

describe('useActivityMediator', () => {
  it('should switch to game mode when "play" command is handled', () => {
    const { result } = renderHook(() => useActivityMediator({ phrase: [], prompt: '', unlocked: false }));

    act(() => {
      result.current.handleCommand('play');
    });

    expect(result.current.currentActivity).toBe(ActivityType.GAME);
    expect(result.current.isInGameMode).toBe(true);
    expect(result.current.isInTutorial).toBe(false);
  });

  it('should not change mode for unknown commands', () => {
    const { result } = renderHook(() => useActivityMediator({ phrase: [], prompt: '', unlocked: false }));

    act(() => {
      result.current.handleCommand('unknown');
    });

    expect(result.current.currentActivity).toBe(ActivityType.TUTORIAL);
    expect(result.current.isInGameMode).toBe(false);
    expect(result.current.isInTutorial).toBe(false);
  });
});

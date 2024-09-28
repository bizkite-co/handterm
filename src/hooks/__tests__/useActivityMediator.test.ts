/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useActivityMediator } from '../useActivityMediator';
import { ActivityType } from '../../types/Types';

describe('useActivityMediator', () => {
  it('should switch to game mode when "play" command is handled', () => {
    const { result } = renderHook(() => useActivityMediator({ phrase: [], prompt: '', unlocked: false }));

    act(() => {
      result.current.handleCommandExecuted('play', [],{});
    });

    expect(result.current.currentActivity).toBe(ActivityType.TUTORIAL);
    expect(result.current.isInGameMode).toBe(false);
    expect(result.current.isInTutorial).toBe(true);
  });

  it('should not change mode for unknown commands', () => {
    const { result } = renderHook(() => useActivityMediator({ phrase: [], prompt: '', unlocked: false }));

    act(() => {
      result.current.handleCommandExecuted('unknown', [], {});
    });

    expect(result.current.currentActivity).toBe(ActivityType.NORMAL);
    expect(result.current.isInGameMode).toBe(false);
    expect(result.current.isInTutorial).toBe(false);
    expect(result.current.isInNormal).toBe(true);
  });

  it('should set hero action', () => {
    const { result } = renderHook(() => useActivityMediator({ phrase: [], prompt: '', unlocked: false }));

    act(() => {
      result.current.setHeroAction('Run');
    });

    expect(result.current.heroAction).toBe('Run');
  });

  it('should set zombie4 action', () => {
    const { result } = renderHook(() => useActivityMediator({ phrase: [], prompt: '', unlocked: false }));

    act(() => {
      result.current.setZombie4Action('Attack');
    });

    expect(result.current.zombie4Action).toBe('Attack');
  });

  it('should set next achievement when provided', () => {
    const { result } = renderHook(() => useActivityMediator({ phrase: [], prompt: '', unlocked: false }));

    act(() => {
      result.current.setNextTutorial({ phrase: ['test'], prompt: 'Test prompt', unlocked: false });
    });

    expect(result.current.tutorial).toEqual({ phrase: ['test'], prompt: 'Test prompt', unlocked: false });
  });

  it('should not change achievement when null is provided', () => {
    const { result } = renderHook(() => useActivityMediator({ phrase: ['initial'], prompt: 'Initial prompt', unlocked: false }));

    act(() => {
      result.current.setNextTutorial(null);
    });

    expect(result.current.tutorial).toEqual({ phrase: ['initial'], prompt: 'Initial prompt', unlocked: false });
  });

  it('should unlock achievement when correct command is provided', () => {
    const { result } = renderHook(() => useActivityMediator({ phrase: ['test'], prompt: 'Test prompt', unlocked: false }));

    let nextAchievement;
    act(() => {
      nextAchievement = result.current.checkTutorialProgress('test');
    });

    expect(nextAchievement).not.toBeNull();
    expect(result.current.tutorial).not.toEqual({ phrase: ['test'], prompt: 'Test prompt', unlocked: false });
  });

  it('should not unlock achievement when incorrect command is provided', () => {
    const { result } = renderHook(() => useActivityMediator({ phrase: ['test'], prompt: 'Test prompt', unlocked: false }));

    act(() => {
      result.current.checkTutorialProgress('wrong');
    });

    expect(result.current.tutorial.unlocked).toBe(false);
  });
});

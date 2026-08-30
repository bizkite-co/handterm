import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActivityMediator } from 'src/hooks/useActivityMediator';
import { allTutorialKeys, StorageKeys, ActivityType } from '@handterm/types';
import { activitySignal } from 'src/signals/appSignals';
import { completedTutorialsSignal } from 'src/signals/tutorialSignals';

vi.mock('src/hooks/useReactiveLocation', () => ({
  useReactiveLocation: () => ({
    updateLocation: vi.fn(),
    parseLocation: () => ({
      activityKey: 'NORMAL',
      contentKey: '',
      groupKey: ''
    })
  })
}));

describe('useActivityMediator Hook', () => {
  let historySpy: vi.SpyInstance;

  beforeEach(() => {
    localStorage.clear();
    completedTutorialsSignal.value = new Set();
    vi.clearAllMocks();
    historySpy = vi.spyOn(window.history, 'replaceState');
    activitySignal.value = ActivityType.TUTORIAL;
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    historySpy.mockRestore();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useActivityMediator());

    expect(result.current.isInTutorial).toBe(true);
    expect(result.current.isInNormal).toBe(false);
  });

  it('should skip tutorial when completed-tutorials exists in localStorage', () => {
    localStorage.setItem(StorageKeys.completedTutorials, JSON.stringify(allTutorialKeys));
    completedTutorialsSignal.value = new Set(allTutorialKeys);

    renderHook(() => useActivityMediator());

    expect(activitySignal.value).toBe(ActivityType.NORMAL);
  });
});

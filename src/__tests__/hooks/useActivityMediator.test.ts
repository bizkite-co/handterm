import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActivityMediator } from 'src/hooks/useActivityMediator';
import { allTutorialKeys, StorageKeys, ActivityType } from '@handterm/types';
import { activitySignal } from 'src/signals/appSignals';

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
    vi.clearAllMocks();
    historySpy = vi.spyOn(window.history, 'replaceState');
    activitySignal.value = ActivityType.TUTORIAL;
  });

  afterEach(() => {
    historySpy.mockRestore();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useActivityMediator());

    expect(result.current.isInTutorial).toBe(true);
    expect(result.current.isInNormal).toBe(false);
  });

  it('should skip tutorial when completed-tutorials exists in localStorage', async () => {
    localStorage.setItem(StorageKeys.completedTutorials, JSON.stringify(allTutorialKeys));

    const { result } = renderHook(() => useActivityMediator());

    await waitFor(() => {
      expect(result.current.isInNormal).toBe(true);
    });

    expect(result.current.isInTutorial).toBe(false);
    expect(historySpy).toHaveBeenCalledWith({}, '', expect.stringContaining('activity=normal'));
  });
});

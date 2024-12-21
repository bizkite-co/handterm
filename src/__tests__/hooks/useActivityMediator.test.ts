import { describe, it, expect, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useActivityMediator } from 'src/hooks/useActivityMediator';

// Mock dependencies
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
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useActivityMediator());

    expect(result.current.isInNormal).toBe(true);
    expect(result.current.isInGameMode).toBe(false);
    expect(result.current.isInTutorial).toBe(false);
    expect(result.current.isInEdit).toBe(false);
  });
});

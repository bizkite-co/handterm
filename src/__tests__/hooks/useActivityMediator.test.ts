import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActivityMediator } from 'src/hooks/useActivityMediator';
import { allTutorialPhraseNames } from 'src/types/Types';

interface MockLocation extends Location {
  href: string;
  search: string;
  assign: (url: string) => void;
  replace: (url: string) => void;
  reload: () => void;
  toString: () => string;
}

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
  let originalLocation: Location;
  let mockLocation: MockLocation;

  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();

    // Save and mock window.location
    originalLocation = window.location;
    let mockHref = 'http://localhost:3000/?activity=tutorial&key=%250D';
    mockLocation = {
      ...originalLocation,
      get href() {
        return mockHref;
      },
      set href(value: string) {
        mockHref = value;
      },
      get search() {
        return new URL(mockHref).search;
      },
      assign: vi.fn((url: string) => {
        mockHref = url;
      }) as MockLocation['assign'],
      replace: vi.fn((url: string) => {
        mockHref = url;
      }) as MockLocation['replace'],
      reload: vi.fn(() => {}) as MockLocation['reload'],
      toString() {
        return mockHref;
      }
    };

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useActivityMediator());

    expect(result.current.isInTutorial).toBe(true);
    expect(result.current.isInNormal).toBe(false);
    expect(result.current.isInGameMode).toBe(false);
    expect(result.current.isInEdit).toBe(false);
    expect(window.location.search).toContain('activity=tutorial');
  });

  it('should skip tutorial when completed-tutorials exists in localStorage', () => {
    // Setup completed tutorials in localStorage
    window.localStorage.setItem('completed-tutorials', JSON.stringify(allTutorialPhraseNames));

    const { result } = renderHook(() => useActivityMediator());

    expect(result.current.isInNormal).toBe(true);
    expect(result.current.isInTutorial).toBe(false);
    expect(result.current.isInGameMode).toBe(false);
    expect(result.current.isInEdit).toBe(false);
    expect(mockLocation.reload).toHaveBeenCalled();
  });
});

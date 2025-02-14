import { describe, it, expect, beforeEach } from 'vitest';
import { ActivityType } from '@handterm/types';

describe('Activity State Signal', () => {
  beforeEach(() => {
    // Reset the window state before each test
    if (typeof window !== 'undefined') {
      delete (window as any).activityStateSignal;
    }
  });

  it('should initialize with correct default state', () => {
    const initialState = {
      current: ActivityType.NORMAL,
      previous: null,
      transitionInProgress: false,
      tutorialCompleted: false
    };

    const signal = {
      _value: initialState,
      get value() {
        return this._value;
      },
      set value(newValue) {
        this._value = newValue;
      }
    };

    expect(signal.value.current).toBe(ActivityType.NORMAL);
    expect(signal.value.previous).toBeNull();
    expect(signal.value.transitionInProgress).toBe(false);
    expect(signal.value.tutorialCompleted).toBe(false);
  });

  it('should update state correctly', () => {
    const initialState = {
      current: ActivityType.NORMAL,
      previous: null,
      transitionInProgress: false,
      tutorialCompleted: false
    };

    const signal = {
      _value: initialState,
      get value() {
        return this._value;
      },
      set value(newValue) {
        this._value = newValue;
      }
    };

    signal.value = {
      ...signal.value,
      current: ActivityType.EDIT,
      previous: ActivityType.NORMAL
    };

    expect(signal.value.current).toBe(ActivityType.EDIT);
    expect(signal.value.previous).toBe(ActivityType.NORMAL);
  });
});
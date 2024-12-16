import { describe, it, expect, beforeEach } from 'vitest';

import {
  activitySignal,
  isInTutorialModeSignal,
  isInGameModeSignal
} from '../../signals/appSignals';
import { ActivityType } from '../../types/Types';

describe('TUI Activity Switching E2E Scenarios', () => {
  beforeEach(() => {
    // Reset activity signal before each test
    activitySignal.value = ActivityType.NORMAL;
  });

  it('Switches to Tutorial mode', () => {
    // Enter tutorial mode
    activitySignal.value = ActivityType.TUTORIAL;

    // Validate tutorial mode
    expect(activitySignal.value).toBe(ActivityType.TUTORIAL);
    expect(isInTutorialModeSignal.value).toBe(true);
  });

  it('Switches to Game mode', () => {
    // Enter game mode
    activitySignal.value = ActivityType.GAME;

    // Validate game mode
    expect(activitySignal.value).toBe(ActivityType.GAME);
    expect(isInGameModeSignal.value).toBe(true);
  });

  it('Switches between different activities', () => {
    // Switch to tutorial mode
    activitySignal.value = ActivityType.TUTORIAL;
    expect(activitySignal.value).toBe(ActivityType.TUTORIAL);
    expect(isInTutorialModeSignal.value).toBe(true);

    // Switch to game mode
    activitySignal.value = ActivityType.GAME;
    expect(activitySignal.value).toBe(ActivityType.GAME);
    expect(isInGameModeSignal.value).toBe(true);

    // Return to normal mode
    activitySignal.value = ActivityType.NORMAL;
    expect(activitySignal.value).toBe(ActivityType.NORMAL);
    expect(isInTutorialModeSignal.value).toBe(false);
    expect(isInGameModeSignal.value).toBe(false);
  });
});

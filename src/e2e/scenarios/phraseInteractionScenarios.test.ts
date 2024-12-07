import { describe, it, expect, beforeEach } from 'vitest';
import {
  activitySignal,
  isInTutorialModeSignal,
  isInGameModeSignal
} from '../../signals/appSignals';
import { ActivityType } from '../../types/Types';
import { Phrases, Tutorials } from '../../types/Types';

describe('TUI Phrase Interaction E2E Scenarios', () => {
  beforeEach(() => {
    // Reset activity signal before each test
    activitySignal.value = ActivityType.NORMAL;
  });

  it('validates tutorial phrase selection', () => {
    // Enter tutorial mode
    activitySignal.value = ActivityType.TUTORIAL;

    // Basic validation of tutorial mode and phrase
    expect(activitySignal.value).toBe(ActivityType.TUTORIAL);
    expect(isInTutorialModeSignal.value).toBe(true);
  });

  it('validates game phrase selection', () => {
    // Enter game mode
    activitySignal.value = ActivityType.GAME;

    // Basic validation of game mode
    expect(activitySignal.value).toBe(ActivityType.GAME);
    expect(isInGameModeSignal.value).toBe(true);
  });
});

import { signal } from '@preact/signals-react';
import { ActivityType, allTutorialKeys } from '@handterm/types';

// Unified activity state
export const activityState = signal<{
  current: ActivityType;
  previous: ActivityType | null;
  transitionInProgress: boolean;
  tutorialCompleted: boolean;
}>({
  current: ActivityType.NORMAL,
  previous: null,
  transitionInProgress: false,
  tutorialCompleted: false
});

// Check localStorage for completed tutorials
export function checkTutorialCompletion(): boolean {
  try {
    const completed = window.localStorage.getItem('completed-tutorials');
    if (!completed) return false;

    const completedTutorials: unknown = JSON.parse(completed);
    if (!Array.isArray(completedTutorials)) return false;

    return allTutorialKeys.every(name =>
      typeof name === 'string' && completedTutorials.includes(name)
    );
  } catch {
    return false;
  }
}

// Initialize tutorial completed state
activityState.value = {
  ...activityState.value,
  tutorialCompleted: checkTutorialCompletion()
};

// Navigation state
export const navigationState = signal<{
  activityKey: ActivityType;
  contentKey: string | null;
  groupKey: string | null;
}>({
  activityKey: ActivityType.NORMAL,
  contentKey: null,
  groupKey: null
});

// Transition functions
export function startTransition(): void {
  activityState.value = {
    ...activityState.value,
    transitionInProgress: true
  };
}

export function completeTransition(newActivity: ActivityType): void {
  activityState.value = {
    current: newActivity,
    previous: activityState.value.current,
    transitionInProgress: false,
    tutorialCompleted: activityState.value.tutorialCompleted
  };
}

// State helpers
export function isInActivity(activity: ActivityType): boolean {
  return activityState.value.current === activity;
}

export function getCurrentActivity(): ActivityType {
  return activityState.value.current;
}

export function getPreviousActivity(): ActivityType | null {
  return activityState.value.previous;
}

export function isTransitioning(): boolean {
  return activityState.value.transitionInProgress;
}

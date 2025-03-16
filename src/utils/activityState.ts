import { signal } from '@preact/signals-react';
import { ActivityType, allTutorialKeys } from '@handterm/types';

// Navigation state
export const navigationState = signal<{
  activityKey: ActivityType;
  contentKey: string | null;
  groupKey: string | null;
}>({
  activityKey: ActivityType.NORMAL, // Will be updated by URL
  contentKey: null,
  groupKey: null
});

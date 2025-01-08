// src/utils/navigationUtils.ts
import { ActivityType, type ParsedLocation } from 'src/types/Types';

// Parse location from query parameters
export function parseLocation(location: string = window.location.toString()): ParsedLocation {
  const urlParams = new URL(location);

  return {
    activityKey: parseActivityType(urlParams.searchParams.get('activity') ?? ''),
    contentKey: decodeURIComponent(urlParams.searchParams.get('key') ?? ''),
    groupKey: urlParams.searchParams.get('group') ?? null
  };
}

// Helper function to parse activity type
export function parseActivityType(activityString: string): ActivityType {
  const normalizedActivity = (activityString ?? '').toUpperCase();
  return ActivityType[normalizedActivity as keyof typeof ActivityType] ?? ActivityType.NORMAL;
}

// Global navigation function that can be used outside of React components
export function navigate(options: ParsedLocation): void {
  const newActivity = options.activityKey ?? ActivityType.NORMAL;
  const newPhraseKey = options.contentKey != null ? options.contentKey : null;
  const newGroupKey = options.groupKey ?? null;

  const url = new URL(window.location.toString());

  // Set activity parameter
  if (newActivity !== ActivityType.NORMAL) {
    url.searchParams.set('activity', ActivityType[newActivity].toLowerCase());
  } else {
    url.searchParams.delete('activity');
  }

  // Set key parameter
  if (newPhraseKey != null) {
    url.searchParams.set('key', encodeURIComponent(newPhraseKey));
  } else {
    url.searchParams.delete('key');
  }

  // Set group parameter
  if (newGroupKey != null) {
    url.searchParams.set('group', newGroupKey);
  } else {
    url.searchParams.delete('group');
  }

  // Use browser's history API directly
  window.history.pushState(null, '', url.toString());

  // Dispatch a custom event to notify React router or other components about the navigation
  window.dispatchEvent(new CustomEvent('locationchange', {
    detail: {
      activity: newActivity,
      key: newPhraseKey,
      group: newGroupKey
    }
  }));
}

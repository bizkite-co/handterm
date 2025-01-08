// src/utils/navigationUtils.ts
import { ActivityType, type ParsedLocation } from 'src/types/Types';

// Parse location from ?p= parameter
export function parseLocation(location: string = window.location.toString()): ParsedLocation {
  const urlParams = new URL(location);
  const pParam = urlParams.searchParams.get('p') ?? '';

  // Remove leading slash if present
  const cleanPath = pParam.startsWith('/') ? pParam.slice(1) : pParam;
  const [activityKey, phraseKey] = cleanPath.split('/');

  return {
    activityKey: activityKey == null ? ActivityType.NORMAL : parseActivityType(activityKey),
    contentKey: decodeURIComponent(phraseKey ?? ''),
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
  const newPhraseKey = options.contentKey != null ? options.contentKey.replace('\r', '_r') : null;
  const newGroupKey = options.groupKey ?? null;

  const encodedPhraseKey = newPhraseKey != null ? encodeURIComponent(newPhraseKey) : '';
  const path = newActivity === ActivityType.NORMAL ? '' : ActivityType[newActivity].toLowerCase();
  const pParam = `${path}${newPhraseKey !== null ? `/${encodedPhraseKey}` : ''}`;
  const url = new URL(window.location.toString());
  url.searchParams.set('p', pParam);

  if (newGroupKey) {
    url.searchParams.set('group', newGroupKey);
  } else {
    url.searchParams.delete('group');
  }

  // Use browser's history API directly
  window.history.pushState(null, '', url.toString());

  // Dispatch a custom event to notify React router or other components about the navigation
  window.dispatchEvent(new CustomEvent('locationchange', { detail: { path } }));
}

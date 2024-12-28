// src/utils/navigationUtils.ts
import { ActivityType, type ParsedLocation } from 'src/types/Types';

// Parse location from either pathname or ?p= parameter
export function parseLocation(location: string = window.location.toString()): ParsedLocation {
  // First, check for ?p= parameter
  const urlParams = new URL(location);
  const pParam = urlParams.searchParams.get('p');

  if (pParam) {
    // Remove leading slash if present
    const cleanPath = pParam.startsWith('/') ? pParam.slice(1) : pParam;
    const [activityKey, phraseKey] = cleanPath.split('/');

    return {
      activityKey: activityKey == null ? ActivityType.NORMAL : parseActivityType(activityKey),
      contentKey: decodeURIComponent(phraseKey ?? ''),
      groupKey: urlParams.searchParams.get('group') ?? null
    };
  }

  // Fallback to pathname parsing
  const [, activityKey, phraseKey] = window.location.pathname.split('/');
  return {
    activityKey: activityKey == null ? ActivityType.NORMAL : parseActivityType(activityKey),
    contentKey: decodeURIComponent(phraseKey ?? ''),
    groupKey: urlParams.searchParams.get('group') ?? null
  };
}

// Helper function to parse activity type
export function parseActivityType(activityString: string): ActivityType {
  const normalizedActivity = (activityString || '').toUpperCase();
  return ActivityType[normalizedActivity as keyof typeof ActivityType] || ActivityType.NORMAL;
}

// Global navigation function that can be used outside of React components
export function navigate(options: ParsedLocation): void {
  const newActivity = options.activityKey ?? ActivityType.NORMAL;
  const newPhraseKey = options.contentKey ? options.contentKey.replace('\r', '_r') : '';
  const newGroupKey = options.groupKey || '';

  const encodedPhraseKey = newPhraseKey ? encodeURIComponent(newPhraseKey) : '';
  const queryString = newGroupKey ? `?group=${encodeURIComponent(newGroupKey)}` : '';

  const activityPath = newActivity === ActivityType.NORMAL ? '' : ActivityType[newActivity].toLowerCase();
  const path = `/${activityPath}${encodedPhraseKey ? `/${encodedPhraseKey}` : ''}${queryString}`;

  // Use browser's history API directly
  window.history.pushState(null, '', path);

  // Dispatch a custom event to notify React router or other components about the navigation
  window.dispatchEvent(new CustomEvent('locationchange', { detail: { path } }));
}

// src/utils/navigationUtils.ts
import { ParsedLocation, ActivityType } from 'src/types/Types';

// Global navigation function that can be used outside of React components
export function navigate(options: ParsedLocation) {
  const newActivity = options.activityKey || ActivityType.NORMAL;
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

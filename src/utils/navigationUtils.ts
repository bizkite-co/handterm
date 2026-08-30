// src/utils/navigationUtils.ts
import { ActivityType, type ParsedLocation } from '@handterm/types';
// Removed logger import

// Parse location from query parameters
export function parseLocation(location: string = window.location.toString()): ParsedLocation {
  // Add check for empty or invalid location string
  if (!location || typeof location !== 'string') {
    return {
      activityKey: ActivityType.NORMAL,
      contentKey: '',
      groupKey: null,
      clearParams: false
    };
  }
  try {
    const urlParams = new URL(location);

    return {
      activityKey: parseActivityType(urlParams.searchParams.get('activity') ?? ''),
      contentKey: decodeURIComponent(urlParams.searchParams.get('key') ?? ''),
      groupKey: urlParams.searchParams.get('group') ?? null,
      clearParams: urlParams.searchParams.has('clearParams')
    };
  } catch (error) {
    // Handle potential errors during URL construction
    console.error('Error parsing location:', error);
    return {
      activityKey: ActivityType.NORMAL,
      contentKey: '',
      groupKey: null,
      clearParams: false
    };
  }
}

// Helper function to parse activity type
export function parseActivityType(activityString: string): ActivityType {
  const normalizedActivity = (activityString ?? '').toUpperCase();
  const activity = ActivityType[normalizedActivity as keyof typeof ActivityType];
  return activity ?? ActivityType.NORMAL;
}

// Initialize activity state from URL parameters
export function initializeActivityState(): void {
  const location = parseLocation();
  if (location.activityKey && location.activityKey !== ActivityType.NORMAL) {
    window.dispatchEvent(new CustomEvent('locationchange', {
      detail: {
        activity: location.activityKey,
        key: location.contentKey,
        group: location.groupKey
      }
    }));
  }
}

export interface NavigationOptions {
  forceClear?: boolean;
  replace?: boolean;
  skipTutorial?: boolean;
}

// Global navigation function that can be used outside of React components
// ENHANCED: Add small delay after dispatching locationchange event
export async function navigate(options: ParsedLocation, navOptions: boolean | NavigationOptions = false): Promise<void> {
// END ENHANCED
  const forceClear = typeof navOptions === 'boolean' ? navOptions : navOptions.forceClear ?? false;
  const replace = typeof navOptions === 'boolean' ? false : navOptions.replace ?? false;
  const skipTutorial = typeof navOptions === 'boolean' ? false : navOptions.skipTutorial ?? false;
  const newActivity = options.activityKey ?? ActivityType.NORMAL;
  const newPhraseKey = options.contentKey != null ? options.contentKey : null;
  const newGroupKey = options.groupKey ?? null;
  const clearParams = options.clearParams ?? false;

  const path = window.location.pathname.replace(/\/+/g, '/').replace(/\/+$/, '');
  const baseUrl = window.location.origin + (path || '/');
  let finalUrl = baseUrl;

  if (newActivity === ActivityType.NORMAL || clearParams || forceClear || skipTutorial) {
    // Keep URL as baseUrl (no search params)
    window.history.replaceState({}, '', finalUrl); // Use replaceState for clearing
    window.dispatchEvent(new CustomEvent('locationchange', {
      detail: { activity: ActivityType.NORMAL, key: null, group: null, clearParams: true }
    }));
    // ENHANCED: Add small delay after dispatching event
    await new Promise(resolve => setTimeout(resolve, 50));
    // END ENHANCED
    return;
  } else {
    const params = new URLSearchParams();
    params.set('activity', newActivity.toLowerCase());

    // Explicitly delete 'key' before setting, just in case
    params.delete('key');
    if (newPhraseKey != null) {
      params.set('key', encodeURIComponent(newPhraseKey));
    }
    // No need for an else block here, as delete already happened

    if (newGroupKey != null) {
      params.set('group', newGroupKey);
    } else {
       params.delete('group'); // Ensure group is deleted if null
    }

    if (clearParams) {
      params.set('clearParams', 'true');
    } else {
       params.delete('clearParams'); // Ensure clearParams is deleted if false
    }

    const searchString = params.toString();
    finalUrl = `${baseUrl}?${searchString}`;
  }

  const historyMethod = (clearParams || forceClear || skipTutorial || replace) ? 'replaceState' : 'pushState';
  window.history[historyMethod]({}, '', finalUrl);

  window.dispatchEvent(new CustomEvent('locationchange', {
    detail: { activity: newActivity, key: newPhraseKey, group: newGroupKey, clearParams }
  }));
  // ENHANCED: Add small delay after dispatching event
  await new Promise(resolve => setTimeout(resolve, 50));
  // END ENHANCED
}

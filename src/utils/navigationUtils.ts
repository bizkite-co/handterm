// src/utils/navigationUtils.ts
import { ActivityType, type ParsedLocation } from '@handterm/types';

// Parse location from query parameters
export function parseLocation(location: string = window.location.toString()): ParsedLocation {
  const urlParams = new URL(location);

  return {
    activityKey: parseActivityType(urlParams.searchParams.get('activity') ?? ''),
    contentKey: decodeURIComponent(urlParams.searchParams.get('key') ?? ''),
    groupKey: urlParams.searchParams.get('group') ?? null,
    clearParams: urlParams.searchParams.has('clearParams')
  };
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

interface NavigationOptions {
  forceClear?: boolean;
  replace?: boolean;
  skipTutorial?: boolean;
}

// Global navigation function that can be used outside of React components
export function navigate(options: ParsedLocation, navOptions: boolean | NavigationOptions = false): void {
  // Handle legacy boolean parameter
  const forceClear = typeof navOptions === 'boolean' ? navOptions : navOptions.forceClear ?? false;
  const replace = typeof navOptions === 'boolean' ? false : navOptions.replace ?? false;
  const skipTutorial = typeof navOptions === 'boolean' ? false : navOptions.skipTutorial ?? false;
  const newActivity = options.activityKey ?? ActivityType.NORMAL;
  const newPhraseKey = options.contentKey != null ? options.contentKey : null;
  const newGroupKey = options.groupKey ?? null;
  const clearParams = options.clearParams ?? false;

  // Normalize path and remove any trailing slashes
  const path = window.location.pathname.replace(/\/+/g, '/').replace(/\/+$/, '');
  const baseUrl = window.location.origin + (path || '/');
  const url = new URL(baseUrl);

  if (newActivity === ActivityType.NORMAL || clearParams || forceClear || skipTutorial) {
    // Clear all parameters for NORMAL activity, when clearParams/forceClear is true, or when skipping tutorial
    url.search = '';
    // Use replaceState to avoid creating new history entries when clearing params
    window.history.replaceState({}, '', url.toString());
    // Dispatch event with NORMAL activity to reset state
    window.dispatchEvent(new CustomEvent('locationchange', {
      detail: {
        activity: ActivityType.NORMAL,
        key: null,
        group: null,
        clearParams: true
      }
    }));
    // Force clear any remaining params by reloading the page
    if (window.location.search) {
      window.location.reload();
    }
    return; // Early return to prevent setting any params
  } else {
    // Set activity parameter
    url.searchParams.set('activity', newActivity.toLowerCase());

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

    // Set clearParams if specified
    if (clearParams) {
      url.searchParams.set('clearParams', 'true');
    } else {
      url.searchParams.delete('clearParams');
    }
  }

  // Log navigation for debugging
  console.log(`NAVIGATING to: ${url.search.toString()}`);

  // Use replaceState when clearing params, for NORMAL activity, or when replace option is true
  const historyMethod = (clearParams || forceClear || skipTutorial || replace)
    ? 'replaceState'
    : 'pushState';
  window.history[historyMethod]({}, '', url.toString());

  // Always dispatch location change event
  window.dispatchEvent(new CustomEvent('locationchange', {
    detail: {
      activity: newActivity,
      key: newPhraseKey,
      group: newGroupKey,
      clearParams
    }
  }));
}

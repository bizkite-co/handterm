import { useSignal, useComputed } from '@preact/signals-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useCallback, useMemo } from 'react';
import { ParsedLocation, ActivityType } from 'src/types/Types';
import { parseLocation } from 'src/utils/navigationUtils';

export function useReactiveLocation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [_searchParams] = useSearchParams();

  const pathSignal = useSignal(location.pathname);
  const searchSignal = useSignal(location.search);
  const isInitialized = useSignal(false);

  // Debounce mechanism to prevent rapid navigation
  const lastNavigationTime = useSignal(0);
  const NAVIGATION_THROTTLE_DELAY = 100; // ms

  useEffect(() => {
    if (!isInitialized.value) {
      pathSignal.value = location.pathname;
      searchSignal.value = location.search;
      isInitialized.value = true;
    } else {
      // Only update if the location has actually changed
      if (pathSignal.value !== location.pathname || searchSignal.value !== location.search) {
        pathSignal.value = location.pathname;
        searchSignal.value = location.search;
      }
    }
  }, [location, pathSignal, searchSignal, isInitialized]);

  const updateLocation = useCallback((options: ParsedLocation) => {
    const currentTime = Date.now();

    // Throttle navigation to prevent rapid calls
    if (currentTime - lastNavigationTime.value < NAVIGATION_THROTTLE_DELAY) {
      return;
    }

    const currentLocation = parseLocation();

    const newActivity = options.activityKey === undefined ? currentLocation.activityKey :
      (options.activityKey === null ? ActivityType.NORMAL : options.activityKey);

    const newPhraseKey = options.contentKey === undefined ? currentLocation.contentKey :
      (options.contentKey === null ? '' : options.contentKey.replace('\r', '_r'));

    const newGroupKey = options.groupKey === undefined ? currentLocation.groupKey :
      (options.groupKey === null ? '' : options.groupKey);

    const encodedPhraseKey = newPhraseKey ? encodeURIComponent(newPhraseKey) : '';
    const queryString = newGroupKey ? `?group=${encodeURIComponent(newGroupKey)}` : '';

    const activityPath = newActivity === ActivityType.NORMAL ? '' : ActivityType[newActivity].toLowerCase();
    const newPath = `/${activityPath}${encodedPhraseKey ? `/${encodedPhraseKey}` : ''}${queryString}`;

    // Only navigate if the new path is different from the current path
    if (newPath !== pathSignal.value) {
      pathSignal.value = newPath;

      // Update last navigation time
      lastNavigationTime.value = currentTime;

      navigate(newPath, {
        // Add replace option to reduce navigation stack entries
        replace: true
      });
    }
  }, [navigate, pathSignal, lastNavigationTime]);

  return {
    parseLocation: () => parseLocation(),
    updateLocation,
    pathname: pathSignal,
    search: searchSignal,
    isInitialized: useComputed(() => isInitialized.value)
  };
}

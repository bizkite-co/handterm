import { useSignal, useComputed } from '@preact/signals-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { ParsedLocation, ActivityType } from 'src/types/Types';
import { parseLocation } from 'src/utils/navigationUtils';

export function useReactiveLocation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [_searchParams] = useSearchParams();

  const pathSignal = useSignal(location.pathname);
  const searchSignal = useSignal(location.search);
  const isInitialized = useSignal(false);

  useEffect(() => {
    if (!isInitialized.value) {
      pathSignal.value = location.pathname;
      searchSignal.value = location.search;
      isInitialized.value = true;
    } else {
      pathSignal.value = location.pathname;
      searchSignal.value = location.search;
    }
  }, [location, pathSignal, searchSignal, isInitialized]);

  const updateLocation = useCallback((options: ParsedLocation) => {
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
    const path = `/${activityPath}${encodedPhraseKey ? `/${encodedPhraseKey}` : ''}${queryString}`;

    pathSignal.value = path
    navigate(path);
  }, [navigate, pathSignal]);

  return {
    parseLocation: () => parseLocation(),
    updateLocation,
    pathname: pathSignal,
    search: searchSignal,
    isInitialized: useComputed(() => isInitialized.value)
  };
}

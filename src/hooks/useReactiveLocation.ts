import { useSignal, useComputed } from '@preact/signals-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useCallback, useMemo, useRef } from 'react';
import { ParsedLocation, ActivityType } from 'src/types/Types';
import { createLogger, LogLevel } from 'src/utils/Logger';

// const logger = createLogger('useReactiveLocation', LogLevel.DEBUG);

export function useReactiveLocation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const pathSignal = useSignal(location.pathname);
  const searchSignal = useSignal(location.search);
  const isInitialized = useSignal(false);
  const initialPathRef = useRef(location.pathname);

  useEffect(() => {
    if (!isInitialized.value) {
      pathSignal.value = initialPathRef.current;
      searchSignal.value = location.search;
      isInitialized.value = true;
    } else {
      pathSignal.value = location.pathname;
      searchSignal.value = location.search;
    }
  }, [location]);

  const parseActivityType = useCallback((activityString: string): ActivityType => {
    const normalizedActivity = activityString.toUpperCase();
    return ActivityType[normalizedActivity as keyof typeof ActivityType] || ActivityType.NORMAL;
  }, []);

  const parseLocation = (): ParsedLocation => {
    const [, activityKey, phraseKey] = window.location.pathname.split('/');
    const parsedActivity: ActivityType = parseActivityType(activityKey || '');
    return {
      activityKey: parsedActivity,
      contentKey: decodeURIComponent(phraseKey) || undefined,
      groupKey: decodeURIComponent(searchParams.get('group') ?? '') || undefined
    };
  }

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
  }, [navigate]);

  return {
    parseLocation,
    updateLocation,
    pathname: pathSignal,
    search: searchSignal,
    isInitialized: useComputed(() => isInitialized.value)
  };
}
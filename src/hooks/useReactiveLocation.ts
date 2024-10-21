import { useSignal, useComputed } from '@preact/signals-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useCallback, useMemo, useRef } from 'react';
import { ParsedLocation, ActivityType } from 'src/types/Types';
import { createLogger, LogLevel } from 'src/utils/Logger';

const logger = createLogger('useReactiveLocation', LogLevel.DEBUG);

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
      logger.debug('Location initialized:', initialPathRef.current);
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
      phraseKey: decodeURIComponent(phraseKey) || undefined,
      groupKey: decodeURIComponent(searchParams.get('group') ?? '') || undefined
    };
  }

  const updateLocation = useCallback((options: {
    activity?: ActivityType | null;
    phraseKey?: string | null;
    groupKey?: string | null;
  }) => {
    const currentLocation = parseLocation();

    const newActivity = options.activity === undefined ? currentLocation.activityKey :
      (options.activity === null ? ActivityType.NORMAL : options.activity);

    const newPhraseKey = options.phraseKey === undefined ? currentLocation.phraseKey :
      (options.phraseKey === null ? '' : options.phraseKey.replace('\r', '_r'));

    const newGroupKey = options.groupKey === undefined ? currentLocation.groupKey :
      (options.groupKey === null ? '' : options.groupKey);

    const encodedPhraseKey = newPhraseKey ? encodeURIComponent(newPhraseKey) : '';
    const queryString = newGroupKey ? `?group=${encodeURIComponent(newGroupKey)}` : '';

    const activityPath = newActivity === ActivityType.NORMAL ? '' : ActivityType[newActivity].toLowerCase();
    const path = `/${activityPath}${encodedPhraseKey ? `/${encodedPhraseKey}` : ''}${queryString}`;

    pathSignal.value = path 
    logger.debug('Updating path:', path, 'Current path:', window.location.pathname);
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
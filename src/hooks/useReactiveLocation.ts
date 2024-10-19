import { useSignal, useComputed } from '@preact/signals-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { ParsedLocation, ActivityType } from 'src/types/Types';

export function useReactiveLocation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const pathSignal = useSignal(location.pathname);
  const searchSignal = useSignal(location.search);

  useEffect(() => {
    pathSignal.value = location.pathname;
    searchSignal.value = location.search;
  }, [location]);

  const parsedLocation = useComputed<ParsedLocation>(() => {
    const [, activity, id] = pathSignal.value.split('/');
    const parsedActivity = ActivityType[activity.toString().toUpperCase()];
    return {
      activity: (parsedActivity || ActivityType.NORMAL),
      phraseId: id || undefined,
      tutorialGroup: searchParams.get('group') || undefined
    };
  });

  const reactiveLocation = {
    get activity() { return parsedLocation.value.activity; },
    set activity(value: ActivityType) { updateLocation({ activity: value }); },
    get phraseKey() { return parsedLocation.value.phraseId; },
    set phraseKey(value: string | undefined) { updateLocation({ phraseKey: value }); },
    get groupKey() { return parsedLocation.value.tutorialGroup; },
    set groupKey(value: string | undefined) { updateLocation({ groupKey: value }); },
    getPath() {
      const activity = this.activity === ActivityType.NORMAL ? '' : this.activity;
      const phraseKey = this.phraseKey ? `/${encodeURIComponent(this.phraseKey)}` : '';
      const groupKey = this.groupKey ? `?group=${encodeURIComponent(this.groupKey)}` : '';
      return `/${activity}${phraseKey}${groupKey}`;
    }
  };

  const updateLocation = (options: {
    activity?: ActivityType;
    phraseKey?: string;
    groupKey?: string;
  }) => {
    const newActivity = options.activity || reactiveLocation.activity;
    const newPhraseKey = options.phraseKey !== undefined ? options.phraseKey : reactiveLocation.phraseKey;
    const newGroupKey = options.groupKey !== undefined ? options.groupKey : reactiveLocation.groupKey;

    const encodedId = newPhraseKey ? encodeURIComponent(newPhraseKey) : '';
    const queryString = newGroupKey ? `?group=${encodeURIComponent(newGroupKey)}` : '';
    
    let path = '/';
    switch (newActivity) {
      case ActivityType.GAME:
      case ActivityType.TUTORIAL:
      case ActivityType.EDIT:
        path = `/${newActivity}/${encodedId}${queryString}`;
        break;
    }

    navigate(path);
  };

  const navigateTo = (path: string, options?: { replace?: boolean }) => {
    navigate(path, options);
  };

  return {
    parsedLocation,
    reactiveLocation,
    navigateTo,
    pathname: pathSignal,
    search: searchSignal
  };
}

import { useLocation, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

type ParsedLocation = {
  activity: 'normal' | 'game' | 'tutorial' | 'edit';
  phraseId?: string;
  tutorialGroup?: string;
};

export function useCustomLocation(): ParsedLocation {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const [, activity, id] = location.pathname.split('/');
    return {
      activity: (activity || 'normal') as ParsedLocation['activity'],
      phraseId: id || undefined,
      tutorialGroup: searchParams.get('group') || undefined
    };
  }, [location.pathname, searchParams]);
}
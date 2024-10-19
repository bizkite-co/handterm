import { useLocation, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { ParsedLocation } from 'src/types/Types';


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
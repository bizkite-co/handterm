import { useSignal, useComputed } from '@preact/signals-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { ParsedLocation } from 'src/types/Types';

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
    return {
      activity: (activity || 'normal') as ParsedLocation['activity'],
      phraseId: id || undefined,
      tutorialGroup: searchParams.get('group') || undefined
    };
  });

  const navigateTo = (path: string, options?: { replace?: boolean }) => {
    navigate(path, options);
  };

  return {
    parsedLocation,
    navigateTo,
    pathname: pathSignal,
    search: searchSignal
  };
}

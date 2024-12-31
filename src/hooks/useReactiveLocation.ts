import { useSignal, useComputed } from '@preact/signals-react';
import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

interface ReactiveLocation {
  pathname: ReturnType<typeof useSignal<string>>;
  search: ReturnType<typeof useSignal<string>>;
  isInitialized: ReturnType<typeof useComputed<boolean>>;
}

export function useReactiveLocation(): ReactiveLocation {
  const location = useLocation();
  useSearchParams();

  const pathSignal = useSignal(location.pathname);
  const searchSignal = useSignal(location.search);
  const isInitialized = useSignal(false);

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
  }, [location]);


  return {
    pathname: pathSignal,
    search: searchSignal,
    isInitialized: useComputed(() => isInitialized.value)
  };
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { QueryClientConfig, QueryClient as QueryClientType } from '@tanstack/react-query';

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
};

// TODO: Investigate why @tanstack/react-query types are causing ESLint errors
const queryClient: QueryClientType = new QueryClient(queryClientConfig);

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

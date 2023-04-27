import { WrapperComponent } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from 'react-query';

export const WrapperReactQuery: WrapperComponent<Element> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

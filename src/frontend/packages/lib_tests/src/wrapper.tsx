import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Fragment, PropsWithChildren } from 'react';

import { RenderOptions, appendUtilsElement } from './render';

export const WrapperReactQuery = ({ children }: PropsWithChildren) => {
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

export const wrapperUtils =
  (options?: Partial<RenderOptions>) =>
  ({ children }: PropsWithChildren) => {
    return appendUtilsElement(<Fragment>{children}</Fragment>, options);
  };

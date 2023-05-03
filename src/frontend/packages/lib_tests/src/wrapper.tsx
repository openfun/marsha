import { WrapperComponent } from '@testing-library/react-hooks';
import { Fragment } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { appendUtilsElement, RenderOptions } from './render';

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

export const wrapperUtils =
  (options?: Partial<RenderOptions>): WrapperComponent<Element> =>
  ({ children }: Element) => {
    return appendUtilsElement(<Fragment>{children}</Fragment>, options);
  };

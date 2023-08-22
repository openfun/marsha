import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Fragment, PropsWithChildren } from 'react';
import 'jest-styled-components';

import { RenderOptions, appendUtilsElement } from './render';

const customLogger = {
  log: console.log,
  warn: console.warn,
  // disable the "invalid json response body" error when testing failure
  error: jest.fn(),
};

export const WrapperReactQuery = ({ children }: PropsWithChildren) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
    logger: customLogger,
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

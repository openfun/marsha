import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { useThumbnailMetadata } from '.';

setLogger({
  log: console.log,
  warn: console.warn,
  // no more errors on the console
  error: () => {},
});

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

let Wrapper: WrapperComponent<Element>;

describe('useThumbnailMetadata', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    Wrapper = ({ children }: Element) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('requests the thumbnail metadata', async () => {
    const thumbnailMetadata = {
      name: 'Picture List',
      description: 'Viewset for the API of the timed text object.',
      renders: ['application/json', 'text/html'],
      parses: [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
      ],

      upload_max_size_bytes: 100,
    };
    fetchMock.mock(`/api/thumbnails/`, thumbnailMetadata);

    const { result, waitFor } = renderHook(() => useThumbnailMetadata('fr'), {
      wrapper: Wrapper,
    });
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/thumbnails/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'fr',
      },
      method: 'OPTIONS',
    });
    expect(result.current.data).toEqual(thumbnailMetadata);
    expect(result.current.status).toEqual('success');
  });

  it('fails to get the thumbnail metadata', async () => {
    fetchMock.mock(`/api/thumbnails/`, 401);

    const { result, waitFor } = renderHook(() => useThumbnailMetadata('en'), {
      wrapper: Wrapper,
    });

    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/thumbnails/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'OPTIONS',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});

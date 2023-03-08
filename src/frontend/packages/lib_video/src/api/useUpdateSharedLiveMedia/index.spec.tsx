import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { sharedLiveMediaMockFactory, useJwt } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { useUpdateSharedLiveMedia } from '.';

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

describe('useUpdateSharedLiveMedia', () => {
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

  it('updates the resource', async () => {
    const sharedLiveMedia = sharedLiveMediaMockFactory();
    fetchMock.patch(
      `/api/sharedlivemedias/${sharedLiveMedia.id}/`,
      sharedLiveMedia,
    );

    const { result, waitFor } = renderHook(
      () => useUpdateSharedLiveMedia(sharedLiveMedia.id),
      {
        wrapper: Wrapper,
      },
    );
    result.current.mutate({
      title: 'updated title',
    });
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/sharedlivemedias/${sharedLiveMedia.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });
    expect(result.current.data).toEqual(sharedLiveMedia);
    expect(result.current.status).toEqual('success');
  });

  it('fails to update the resource', async () => {
    const sharedLiveMedia = sharedLiveMediaMockFactory();
    fetchMock.patch(`/api/sharedlivemedias/${sharedLiveMedia.id}/`, 400);

    const { result, waitFor } = renderHook(
      () => useUpdateSharedLiveMedia(sharedLiveMedia.id),
      {
        wrapper: Wrapper,
      },
    );
    result.current.mutate({
      title: 'updated title',
    });
    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/sharedlivemedias/${sharedLiveMedia.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});

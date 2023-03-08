import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { usePairingVideo } from '.';

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

describe('usePairingingVideo', () => {
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
    const video = videoMockFactory();
    fetchMock.get(`/api/videos/${video.id}/pairing-secret/`, {
      secret: '12345',
    });

    const { result, waitFor } = renderHook(() => usePairingVideo(video.id), {
      wrapper: Wrapper,
    });
    result.current.mutate();
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/pairing-secret/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });
    expect(result.current.data).toEqual({ secret: '12345' });
    expect(result.current.status).toEqual('success');
  });

  it('fails to update the resource', async () => {
    const video = videoMockFactory();
    fetchMock.get(`/api/videos/${video.id}/pairing-secret/`, 400);

    const { result, waitFor } = renderHook(() => usePairingVideo(video.id), {
      wrapper: Wrapper,
    });
    result.current.mutate();
    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/pairing-secret/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});

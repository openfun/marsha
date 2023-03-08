import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { useStopLiveRecording } from '.';

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

describe('useStopLiveRecording', () => {
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
    fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, video);

    const onError = jest.fn();
    const { result, waitFor } = renderHook(
      () => useStopLiveRecording(video.id, onError),
      {
        wrapper: Wrapper,
      },
    );
    result.current.mutate();
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/stop-recording/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    });
    expect(result.current.data).toEqual(video);
    expect(result.current.status).toEqual('success');

    expect(onError).not.toHaveBeenCalled();
  });

  it('fails to update the resource', async () => {
    const video = videoMockFactory();
    fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, 400);

    const onError = jest.fn();
    const { result, waitFor } = renderHook(
      () => useStopLiveRecording(video.id, onError),
      {
        wrapper: Wrapper,
      },
    );
    result.current.mutate();
    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/stop-recording/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');

    expect(onError).toHaveBeenCalled();
  });
});

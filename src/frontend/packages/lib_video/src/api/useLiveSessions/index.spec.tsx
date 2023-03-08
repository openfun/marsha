import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { liveSessionFactory, useJwt } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';
import { v4 as uuidv4 } from 'uuid';

import { useLiveSessionsQuery } from '.';

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

const videoId = 'some-video-id';

let Wrapper: WrapperComponent<Element>;

describe('useLiveSessions', () => {
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

  it('requests the resource list', async () => {
    const liveSessions = Array(4).fill(liveSessionFactory());
    fetchMock.mock(
      '/api/videos/some-video-id/livesessions/?limit=999',
      liveSessions,
    );

    const { result, waitFor } = renderHook(
      () => useLiveSessionsQuery(videoId, {}),
      {
        wrapper: Wrapper,
      },
    );
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(
      '/api/videos/some-video-id/livesessions/?limit=999',
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(result.current.data).toEqual(liveSessions);
    expect(result.current.status).toEqual('success');
  });

  it('requests live sessions with an anonymous_id', async () => {
    const liveSessions = Array(4).fill(liveSessionFactory());
    const anonymousId = uuidv4();
    fetchMock.mock(
      `/api/videos/some-video-id/livesessions/?limit=999&anonymous_id=${anonymousId}`,
      liveSessions,
    );

    const { result, waitFor } = renderHook(
      () => useLiveSessionsQuery(videoId, { anonymous_id: anonymousId }),
      {
        wrapper: Wrapper,
      },
    );
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/some-video-id/livesessions/?limit=999&anonymous_id=${anonymousId}`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(result.current.data).toEqual(liveSessions);
    expect(result.current.status).toEqual('success');
  });

  it('fails to get the resource list', async () => {
    fetchMock.mock('/api/videos/some-video-id/livesessions/?limit=999', 404);

    const { result, waitFor } = renderHook(
      () => useLiveSessionsQuery(videoId, {}),
      {
        wrapper: Wrapper,
      },
    );

    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual(
      '/api/videos/some-video-id/livesessions/?limit=999',
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});

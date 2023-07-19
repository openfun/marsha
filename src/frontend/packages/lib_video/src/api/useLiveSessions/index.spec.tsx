import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { liveSessionFactory, useJwt } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';
import { v4 as uuidv4 } from 'uuid';

import { useLiveSessionsQuery } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

const videoId = 'some-video-id';

describe('useLiveSessions', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
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

    const { result } = renderHook(() => useLiveSessionsQuery(videoId, {}), {
      wrapper: WrapperReactQuery,
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

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

    const { result } = renderHook(
      () => useLiveSessionsQuery(videoId, { anonymous_id: anonymousId }),
      {
        wrapper: WrapperReactQuery,
      },
    );
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

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

    const { result } = renderHook(() => useLiveSessionsQuery(videoId, {}), {
      wrapper: WrapperReactQuery,
    });

    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

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

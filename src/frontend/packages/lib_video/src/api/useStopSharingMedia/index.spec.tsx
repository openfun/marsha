import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import {
  sharedLiveMediaMockFactory,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { useStopSharingMedia } from '.';

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

describe('useStopSharingMedia', () => {
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
    const videoId = 'id_video';
    const sharedLiveMedia = sharedLiveMediaMockFactory({ video: videoId });
    const video = videoMockFactory({
      id: videoId,
      active_shared_live_media: null,
      active_shared_live_media_page: null,
      shared_live_medias: [sharedLiveMedia],
    });
    fetchMock.patch(`/api/videos/${video.id}/end-sharing/`, {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 200,
      body: JSON.stringify(video),
    });

    const onSuccess = jest.fn();
    const onError = jest.fn();
    const { result, waitFor } = renderHook(
      () => useStopSharingMedia(video.id, { onSuccess, onError }),
      {
        wrapper: Wrapper,
      },
    );
    result.current.mutate();
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/end-sharing/`,
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

    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('fails to update the resource', async () => {
    const videoId = 'id_video';
    const sharedLiveMedia = sharedLiveMediaMockFactory({ video: videoId });
    const video = videoMockFactory({
      id: videoId,
      active_shared_live_media: sharedLiveMedia,
      active_shared_live_media_page: 1,
      shared_live_medias: [sharedLiveMedia],
    });
    fetchMock.patch(`/api/videos/${video.id}/end-sharing/`, 400);

    const onSuccess = jest.fn();
    const onError = jest.fn();
    const { result, waitFor } = renderHook(
      () => useStopSharingMedia(video.id, { onSuccess, onError }),
      {
        wrapper: Wrapper,
      },
    );
    result.current.mutate();
    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/end-sharing/`,
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

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });
});

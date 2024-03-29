import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import {
  sharedLiveMediaMockFactory,
  videoMockFactory,
} from 'lib-components/tests';
import { WrapperReactQuery } from 'lib-tests';

import { useStartSharingMedia } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('useStartSharingMedia', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
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
      active_shared_live_media: sharedLiveMedia,
      active_shared_live_media_page: 1,
      shared_live_medias: [sharedLiveMedia],
    });
    fetchMock.patch(`/api/videos/${video.id}/start-sharing/`, {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 200,
      body: JSON.stringify(video),
    });

    const onSuccess = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(
      () => useStartSharingMedia(video.id, { onSuccess, onError }),
      {
        wrapper: WrapperReactQuery,
      },
    );
    result.current.mutate({ sharedlivemedia: sharedLiveMedia.id });
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/start-sharing/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({ sharedlivemedia: sharedLiveMedia.id }),
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
      active_shared_live_media: null,
      active_shared_live_media_page: null,
      shared_live_medias: [sharedLiveMedia],
    });
    fetchMock.patch(`/api/videos/${video.id}/start-sharing/`, 400);

    const onSuccess = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(
      () => useStartSharingMedia(video.id, { onSuccess, onError }),
      {
        wrapper: WrapperReactQuery,
      },
    );
    result.current.mutate({ sharedlivemedia: sharedLiveMedia.id });
    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/start-sharing/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({ sharedlivemedia: sharedLiveMedia.id }),
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });
});

import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';

import { navigateSharingDoc } from '.';

describe('navigateSharingDoc', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  it('makes a PATCH and returns the updated video', async () => {
    const video = videoMockFactory();
    fetchMock.mock(
      `/api/videos/${video.id}/navigate-sharing/`,
      { ...video, active_shared_live_media_page: 3 },
      {
        method: 'PATCH',
      },
    );

    const updatedVideo = await navigateSharingDoc(video, 3);

    expect(updatedVideo).toEqual({
      ...video,
      active_shared_live_media_page: 3,
    });
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
      'Accept-Language': 'en',
    });
  });

  it('throws when it fails to trigger navigate-sharing (request failure)', async () => {
    const video = videoMockFactory();
    fetchMock.mock(
      `/api/videos/${video.id}/navigate-sharing/`,
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(navigateSharingDoc(video, 3)).rejects.toThrow(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to trigger navigate-sharing (API error)', async () => {
    const video = videoMockFactory();
    fetchMock.mock(`/api/videos/${video.id}/navigate-sharing/`, 400);

    await expect(navigateSharingDoc(video, 3)).rejects.toThrow(
      `Failed to update shared page for video ${video.id}.`,
    );
  });
});

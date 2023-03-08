import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';

import { publishLiveToVod } from '.';

describe('publishLiveToVod', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  it('returns the updated video on success', async () => {
    const expectedVideo = videoMockFactory();
    fetchMock.mock(
      {
        url: `/api/videos/${expectedVideo.id}/live-to-vod/`,
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      expectedVideo,
    );

    const response = await publishLiveToVod(expectedVideo);
    expect(response).toEqual(expectedVideo);
  });

  it('raises an error when it fails to publish the live to vod (api error)', async () => {
    const video = videoMockFactory();
    fetchMock.mock(
      {
        url: `/api/videos/${video.id}/live-to-vod/`,
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(publishLiveToVod(video)).rejects.toThrow(
      'Failed to perform the request',
    );
  });

  it('raises an error when it fails to publish the live to vod (network error)', async () => {
    const video = videoMockFactory();
    fetchMock.mock(
      {
        url: `/api/videos/${video.id}/live-to-vod/`,
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      400,
    );

    await expect(publishLiveToVod(video)).rejects.toThrow(
      `Failed to publish a live streaming to VOD for video ${video.id}.`,
    );
  });
});

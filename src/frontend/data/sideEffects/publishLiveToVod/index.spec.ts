import fetchMock from 'fetch-mock';

import { videoMockFactory } from 'utils/tests/factories';

import { publishLiveToVod } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

describe('publishLiveToVod', () => {
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

    await expect(publishLiveToVod(video)).rejects.toThrowError(
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

    await expect(publishLiveToVod(video)).rejects.toThrowError(
      `Failed to publish a live streaming to VOD for video ${video.id}.`,
    );
  });
});

import fetchMock from 'fetch-mock';

import { liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';

import { harvestLive } from '.';

jest.mock('data/appData', () => ({ appData: { jwt: 'some token' } }));

describe('harvestLive', () => {
  afterEach(() => fetchMock.restore());

  it('sends a POST request to harvest a live video', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    fetchMock.mock(
      `/api/videos/${video.id}/harvest-live/`,
      JSON.stringify({
        ...video,
        live_state: liveState.STOPPED,
      }),
      { method: 'POST' },
    );
    const updatedVideo = await harvestLive(video);

    expect(updatedVideo).toEqual({
      ...video,
      live_state: liveState.STOPPED,
    });
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
    });
  });

  it('throws when it fails to trigger the harvest-live (request failure)', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    fetchMock.mock(
      `/api/videos/${video.id}/harvest-live/`,
      Promise.reject(new Error('Failed to perform the request')),
      { method: 'POST' },
    );

    await expect(harvestLive(video)).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to trigger the harvest-live (API error)', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    fetchMock.mock(`/api/videos/${video.id}/harvest-live/`, 400, {
      method: 'POST',
    });

    await expect(harvestLive(video)).rejects.toThrowError(
      `Failed to harvest a live streaming for video ${video.id}.`,
    );
  });
});

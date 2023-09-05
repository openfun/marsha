import fetchMock from 'fetch-mock';
import { liveState, useJwt, videoMockFactory } from 'lib-components';

import { startLive } from '.';

describe('sideEffects/startLive', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  const video = videoMockFactory({
    live_state: liveState.IDLE,
  });

  it('makes a POST request on the start-live route & returns the updated video', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/start-live/`,
      JSON.stringify({
        ...video,
        live_state: liveState.STARTING,
      }),
      { method: 'POST' },
    );
    const updatedVideo = await startLive(video.id);

    expect(updatedVideo).toEqual({
      ...video,
      live_state: liveState.STARTING,
    });
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
      'Accept-Language': 'en',
    });
  });

  it('throws when it fails to trigger the start-live (request failure)', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/start-live/`,
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(startLive(video.id)).rejects.toThrow(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to trigger the start-live (API error)', async () => {
    fetchMock.mock(`/api/videos/${video.id}/start-live/`, 400);

    await expect(startLive(video.id)).rejects.toThrow(
      `Failed to start a live streaming for video ${video.id}.`,
    );
  });
});

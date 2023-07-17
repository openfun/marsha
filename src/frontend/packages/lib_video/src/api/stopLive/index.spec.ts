import fetchMock from 'fetch-mock';
import { liveState, useJwt, videoMockFactory } from 'lib-components';

import { stopLive } from '.';

describe('sideEffects/stopLive', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  const video = videoMockFactory();

  it('makes a POST request on the stop-live route & returns the updated video', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/stop-live/`,
      JSON.stringify({
        ...video,
        live_state: liveState.STOPPED,
      }),
      { method: 'POST' },
    );
    const updatedVideo = await stopLive(video);

    expect(updatedVideo).toEqual({
      ...video,
      live_state: liveState.STOPPED,
    });
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
    });
  });

  it('throws when it fails to trigger the stop-live (request failure)', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/stop-live/`,
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(stopLive(video)).rejects.toThrow(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to trigger the stop-live (API error)', async () => {
    fetchMock.mock(`/api/videos/${video.id}/stop-live/`, 400);

    await expect(stopLive(video)).rejects.toThrow(
      `Failed to stop a live streaming for video ${video.id}.`,
    );
  });
});

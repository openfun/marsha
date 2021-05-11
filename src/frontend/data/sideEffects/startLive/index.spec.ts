import fetchMock from 'fetch-mock';

import { uploadState, liveState } from '../../../types/tracks';
import { videoMockFactory } from '../../../utils/tests/factories';
import { startLive } from '.';

jest.mock('../../appData', () => ({ appData: { jwt: 'some token' } }));

describe('sideEffects/startLive', () => {
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
    const updatedVideo = await startLive(video);

    expect(updatedVideo).toEqual({
      ...video,
      live_state: liveState.STARTING,
    });
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
    });
  });

  it('throws when it fails to trigger the start-live (request failure)', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/start-live/`,
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(startLive(video)).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to trigger the start-live (API error)', async () => {
    fetchMock.mock(`/api/videos/${video.id}/start-live/`, 400);

    await expect(startLive(video)).rejects.toThrowError(
      `Failed to start a live streaming for video ${video.id}.`,
    );
  });
});

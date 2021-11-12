import fetchMock from 'fetch-mock';

import { liveState } from '../../../types/tracks';
import { videoMockFactory } from '../../../utils/tests/factories';
import { endLive } from '.';

jest.mock('../../appData', () => ({ appData: { jwt: 'some token' } }));

describe('endLive', () => {
  afterEach(() => fetchMock.restore());

  it('sends a POST request to stop a live video', async () => {
    const video = videoMockFactory({
      live_state: liveState.PAUSED,
    });
    fetchMock.mock(
      `/api/videos/${video.id}/end-live/`,
      JSON.stringify({
        ...video,
        live_state: liveState.STOPPED,
      }),
      { method: 'POST' },
    );
    const updatedVideo = await endLive(video);

    expect(updatedVideo).toEqual({
      ...video,
      live_state: liveState.STOPPED,
    });
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
    });
  });

  it('throws when it fails to trigger the end-live (request failure)', async () => {
    const video = videoMockFactory({
      live_state: liveState.PAUSED,
    });
    fetchMock.mock(
      `/api/videos/${video.id}/end-live/`,
      Promise.reject(new Error('Failed to perform the request')),
      { method: 'POST' },
    );

    await expect(endLive(video)).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to trigger the end-live (API error)', async () => {
    const video = videoMockFactory({
      live_state: liveState.PAUSED,
    });
    fetchMock.mock(`/api/videos/${video.id}/end-live/`, 400, {
      method: 'POST',
    });

    await expect(endLive(video)).rejects.toThrowError(
      `Failed to end a live streaming for video ${video.id}.`,
    );
  });
});

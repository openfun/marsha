import fetchMock from 'fetch-mock';

import { LiveModeType, liveState, uploadState } from '../../../types/tracks';
import { videoMockFactory } from '../../../utils/tests/factories';
import { initiateLive } from '.';

jest.mock('../../appData', () => ({ appData: { jwt: 'some token' } }));

describe('sideEffects/initiateLive', () => {
  afterEach(() => fetchMock.restore());

  const video = videoMockFactory({
    upload_state: uploadState.PENDING,
    live_state: null,
    live_info: {},
  });

  it('makes a POST request on the initiate-live route & returns the updated video', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/initiate-live/`,
      JSON.stringify({
        ...video,
        upload_state: uploadState.PENDING,
        live_state: liveState.IDLE,
        live_info: {
          medialive: {
            input: {
              endpoints: ['https://endpoint1', 'https://endpoint2'],
            },
          },
        },
      }),
      { body: { type: LiveModeType.RAW }, method: 'POST' },
    );
    const updatedVideo = await initiateLive(video, LiveModeType.RAW);

    expect(updatedVideo).toEqual({
      ...video,
      upload_state: uploadState.PENDING,
      live_state: liveState.IDLE,
      live_info: {
        medialive: {
          input: {
            endpoints: ['https://endpoint1', 'https://endpoint2'],
          },
        },
      },
    });
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
    });
  });

  it('makes a POST request on the initiate-live to initiate a jitsi live', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/initiate-live/`,
      JSON.stringify({
        ...video,
        upload_state: uploadState.PENDING,
        live_state: liveState.IDLE,
        live_info: {
          medialive: {
            input: {
              endpoints: ['https://endpoint1', 'https://endpoint2'],
            },
          },
        },
      }),
      { body: { type: LiveModeType.JITSI }, method: 'POST' },
    );
    const updatedVideo = await initiateLive(video, LiveModeType.JITSI);

    expect(updatedVideo).toEqual({
      ...video,
      upload_state: uploadState.PENDING,
      live_state: liveState.IDLE,
      live_info: {
        medialive: {
          input: {
            endpoints: ['https://endpoint1', 'https://endpoint2'],
          },
        },
      },
    });
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
    });
  });

  it('throws when it fails to trigger the initiate-live (request failure)', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/initiate-live/`,
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(initiateLive(video, LiveModeType.RAW)).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to trigger the initiate-live (API error)', async () => {
    fetchMock.mock(`/api/videos/${video.id}/initiate-live/`, 400);

    await expect(initiateLive(video, LiveModeType.RAW)).rejects.toThrowError(
      `Failed to initialize a live mode for video ${video.id}.`,
    );
  });
});

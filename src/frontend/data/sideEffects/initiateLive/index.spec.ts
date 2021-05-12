import fetchMock from 'fetch-mock';

import { LiveModeType, liveState, uploadState } from '../../../types/tracks';
import { videoMockFactory } from '../../../utils/tests/factories';
import { initiateLive } from '.';

jest.mock('../../appData', () => ({ appData: { jwt: 'some token' } }));

describe('sideEffects/initiateLive', () => {
  afterEach(() => fetchMock.restore());

  const video = videoMockFactory({
    description: 'Some description',
    has_transcript: false,
    id: '36',
    is_ready_to_show: true,
    show_download: false,
    thumbnail: null,
    timed_text_tracks: [],
    title: 'Some title',
    upload_state: uploadState.PENDING,
    urls: {
      manifests: {
        hls: 'https://example.com/hls.m3u8',
      },
      mp4: {
        144: 'https://example.com/144p.mp4',
        240: 'https://example.com/240p.mp4',
        480: 'https://example.com/480p.mp4',
        720: 'https://example.com/720p.mp4',
        1080: 'https://example.com/1080p.mp4',
      },
      thumbnails: {
        144: 'https://example.com/144p.jpg',
        240: 'https://example.com/240p.jpg',
        480: 'https://example.com/480p.jpg',
        720: 'https://example.com/720p.jpg',
        1080: 'https://example.com/1080p.jpg',
      },
    },
    should_use_subtitle_as_transcript: false,
    playlist: {
      title: 'foo',
      lti_id: 'foo+context_id',
    },
    live_state: null,
    live_info: {},
  });

  it('makes a POST request on the initiate-live route & returns the updated video', async () => {
    fetchMock.mock(
      '/api/videos/36/initiate-live/',
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
      '/api/videos/36/initiate-live/',
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
      '/api/videos/36/initiate-live/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(initiateLive(video, LiveModeType.RAW)).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to trigger the initiate-live (API error)', async () => {
    fetchMock.mock('/api/videos/36/initiate-live/', 400);

    await expect(initiateLive(video, LiveModeType.RAW)).rejects.toThrowError(
      'Failed to initialite a live mode for video 36.',
    );
  });
});

import fetchMock from 'fetch-mock';

import { uploadState, liveState } from '../../../types/tracks';
import { videoMockFactory } from '../../../utils/tests/factories';
import { startLive } from '.';

jest.mock('../../appData', () => ({ appData: { jwt: 'some token' } }));

describe('sideEffects/startLive', () => {
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
    live_state: liveState.IDLE,
    live_info: {
      medialive: {
        input: {
          endpoints: ['https://endpoint1', 'https://endpoint2'],
        },
      },
    },
  });

  it('makes a POST request on the start-live route & returns the updated video', async () => {
    fetchMock.mock(
      '/api/videos/36/start-live/',
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
      '/api/videos/36/start-live/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(startLive(video)).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to trigger the start-live (API error)', async () => {
    fetchMock.mock('/api/videos/36/start-live/', 400);

    await expect(startLive(video)).rejects.toThrowError(
      'Failed to start a live streaming for video 36.',
    );
  });
});

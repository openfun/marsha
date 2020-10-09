import fetchMock from 'fetch-mock';

import { uploadState, liveState } from '../../../types/tracks';
import { stopLive } from '.';

jest.mock('../../appData', () => ({ appData: { jwt: 'some token' } }));

describe('sideEffects/stopLive', () => {
  afterEach(() => fetchMock.restore());

  const video = {
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
        dash: 'https://example.com/dash.mpd',
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
    live_state: liveState.RUNNING,
    live_info: {
      medialive: {
        input: {
          endpoints: ['https://endpoint1', 'https://endpoint2'],
        },
      },
    },
  };

  it('makes a POST request on the stop-live route & returns the updated video', async () => {
    fetchMock.mock(
      '/api/videos/36/stop-live/',
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
      '/api/videos/36/stop-live/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(stopLive(video)).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to trigger the stop-live (API error)', async () => {
    fetchMock.mock('/api/videos/36/stop-live/', 400);

    await expect(stopLive(video)).rejects.toThrowError(
      'Failed to stop a live streaming for video 36.',
    );
  });
});

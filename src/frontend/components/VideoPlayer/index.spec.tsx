import { render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { ImportMock } from 'ts-mock-imports';

import * as useTimedTextTrackModule from '../../data/stores/useTimedTextTrack';
import { createPlayer } from '../../Player/createPlayer';
import { uploadState } from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import VideoPlayer from './index';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('../../Player/createPlayer', () => ({
  createPlayer: jest.fn(),
}));

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

const useTimedTextTrackStub = ImportMock.mockFunction(
  useTimedTextTrackModule,
  'useTimedTextTrack',
);

const mockVideo = videoMockFactory({
  description: 'Some description',
  id: 'video-id',
  is_ready_to_show: true,
  show_download: false,
  thumbnail: null,
  timed_text_tracks: [],
  title: 'Some title',
  upload_state: uploadState.READY,
  urls: {
    manifests: {
      hls: 'https://example.com/hls.m3u8',
    },
    mp4: {
      144: 'https://example.com/144p.mp4',
      1080: 'https://example.com/1080p.mp4',
    },
    thumbnails: {
      144: 'https://example.com/thumbnail/144p.jpg',
      1080: 'https://example.com/thumbnail/1080p.jpg',
    },
  },
});
jest.mock('../../data/appData', () => ({
  appData: {
    video: mockVideo,
  },
}));

describe('VideoPlayer', () => {
  beforeEach(() =>
    fetchMock.mock(
      '/api/timedtexttracks/',
      {
        actions: {
          POST: {
            language: {
              choices: [
                { display_name: 'English', value: 'en' },
                { display_name: 'French', value: 'fr' },
              ],
            },
          },
        },
      },
      { method: 'OPTIONS' },
    ),
  );

  beforeEach(() => {
    mockCreatePlayer.mockReturnValue({
      destroy: jest.fn(),
    });
  });

  afterEach(() => fetchMock.restore());
  afterEach(jest.clearAllMocks);

  it('starts up the player with HLS source and renders all the relevant sources', async () => {
    useTimedTextTrackStub.returns([
      {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_show: true,
        language: 'fr',
        mode: 'st',
        upload_state: 'ready',
        origin_url: 'https://example.com/timedtext/ttt-1',
        url: 'https://example.com/timedtext/ttt-1.vtt',
      },
      {
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_show: false,
        language: 'fr',
        mode: 'st',
        upload_state: 'ready',
        origin_url: 'https://example.com/timedtext/ttt-2',
        url: 'https://example.com/timedtext/ttt-2.vtt',
      },
      {
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_show: true,
        language: 'en',
        mode: 'cc',
        upload_state: 'ready',
        origin_url: 'https://example.com/timedtext/ttt-3',
        url: 'https://example.com/timedtext/ttt-3.vtt',
      },
      {
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_show: true,
        language: 'fr',
        mode: 'ts',
        upload_state: 'ready',
        origin_url: 'https://example.com/timedtext/ttt-4',
        url: 'https://example.com/timedtext/ttt-4.vtt',
      },
    ]);

    const { container, getByText, queryByText } = render(
      wrapInIntlProvider(
        <VideoPlayer video={mockVideo} playerType={'videojs'} />,
      ),
    );
    await waitFor(() =>
      // The player is created and initialized with DashJS for adaptive bitrate
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        mockVideo,
      ),
    );

    expect(queryByText(/Download this video/i)).toBeNull();
    getByText('Show a transcript');
    expect(container.querySelectorAll('track')).toHaveLength(2);
    expect(
      container.querySelector('source[src="https://example.com/144p.mp4"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('source[src="https://example.com/1080p.mp4"]'),
    ).not.toBeNull();
    expect(container.querySelectorAll('source[type="video/mp4"]')).toHaveLength(
      2,
    );
    const videoElement = container.querySelector('video')!;
    expect(videoElement.tabIndex).toEqual(-1);
    expect(videoElement.poster).toEqual(
      'https://example.com/thumbnail/1080p.jpg',
    );
  });

  it('allows video download when the video object specifies it', async () => {
    mockVideo.show_download = true;

    render(
      wrapInIntlProvider(
        <VideoPlayer video={mockVideo} playerType={'videojs'} />,
      ),
    );

    await screen.findByText(/Download this video/i);
    screen.getByText('Show a transcript');
  });

  it('uses subtitles as transcripts', async () => {
    mockVideo.should_use_subtitle_as_transcript = true;
    mockVideo.has_transcript = false;

    useTimedTextTrackStub.returns([
      {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_show: true,
        language: 'fr',
        mode: 'st',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-1.vtt',
      },
    ]);

    const { container } = render(
      wrapInIntlProvider(
        <VideoPlayer video={mockVideo} playerType={'videojs'} />,
      ),
    );

    await screen.findByText('Show a transcript');
    expect(container.querySelector('option[value="ttt-1"]')).not.toBeNull();
  });

  it('displays transcript with should_use_subtitle_as_transcript enabled', async () => {
    mockVideo.should_use_subtitle_as_transcript = true;
    mockVideo.has_transcript = true;

    useTimedTextTrackStub.returns([
      {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_show: true,
        language: 'fr',
        mode: 'st',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-1.vtt',
      },
      {
        active_stamp: 1549385921,
        id: 'ttt-2',
        is_ready_to_show: true,
        language: 'fr',
        mode: 'ts',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-2.vtt',
      },
    ]);

    const { container } = render(
      wrapInIntlProvider(
        <VideoPlayer video={mockVideo} playerType={'videojs'} />,
      ),
    );

    await screen.findByText('Show a transcript');
    expect(container.querySelector('option[value="ttt-1"]')).toBeNull();
    expect(container.querySelector('option[value="ttt-2"]')).not.toBeNull();
  });
});

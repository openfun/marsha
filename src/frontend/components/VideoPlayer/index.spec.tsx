import { act, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { ImportMock } from 'ts-mock-imports';

import * as useTimedTextTrackModule from '../../data/stores/useTimedTextTrack';
import { createPlayer } from '../../Player/createPlayer';
import { liveState, timedTextMode, uploadState } from '../../types/tracks';
import { VideoPlayerInterface } from '../../types/VideoPlayer';
import {
  timedTextMockFactory,
  videoMockFactory,
} from '../../utils/tests/factories';
import { Deferred } from '../../utils/tests/Deferred';
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
    mockCreatePlayer.mockResolvedValue({
      destroy: jest.fn(),
    });
  });

  afterEach(() => fetchMock.restore());
  afterEach(jest.clearAllMocks);

  it('starts up the player with HLS source and renders all the relevant sources', async () => {
    const timedTextTracks = [
      timedTextMockFactory({
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_show: true,
        source_url: 'https://example.com/timedtext/ttt-1',
        url: 'https://example.com/timedtext/ttt-1.vtt',
      }),
      timedTextMockFactory({
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_show: false,
        source_url: 'https://example.com/timedtext/ttt-2',
        url: 'https://example.com/timedtext/ttt-2.vtt',
      }),
      timedTextMockFactory({
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_show: true,
        language: 'en',
        mode: timedTextMode.CLOSED_CAPTIONING,
        source_url: 'https://example.com/timedtext/ttt-3',
        url: 'https://example.com/timedtext/ttt-3.vtt',
      }),
      timedTextMockFactory({
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.TRANSCRIPT,
        source_url: 'https://example.com/timedtext/ttt-4',
        url: 'https://example.com/timedtext/ttt-4.vtt',
      }),
    ];

    const { container } = render(
      <VideoPlayer
        video={mockVideo}
        playerType={'videojs'}
        timedTextTracks={timedTextTracks}
      />,
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

  it('displays a waiting message while live is not ready', async () => {
    const deferred = new Deferred<VideoPlayerInterface>();
    mockCreatePlayer.mockReturnValue(deferred.promise);

    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });

    const { container } = render(
      wrapInIntlProvider(
        <VideoPlayer
          video={video}
          playerType={'videojs'}
          timedTextTracks={[]}
        />,
      ),
    );

    screen.getByText('Live will begin soon');
    screen.getByText(
      'The live is going to start. You can wait here, the player will start once the live is ready.',
    );

    await act(async () =>
      deferred.resolve({
        destroy: jest.fn(),
      }),
    );

    expect(mockCreatePlayer).toHaveBeenCalledWith(
      'videojs',
      expect.any(Element),
      expect.anything(),
      video,
    ),
      expect(
        screen.queryByText('Live will begin soon'),
      ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'The live is going to start. You can wait here, the player will start once the live is ready.',
      ),
    ).not.toBeInTheDocument();

    const videoElement = container.querySelector('video')!;
    expect(videoElement.tabIndex).toEqual(-1);
  });
});

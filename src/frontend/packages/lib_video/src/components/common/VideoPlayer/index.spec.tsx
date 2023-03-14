/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { screen, waitFor, act } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  timedTextMockFactory,
  videoMockFactory,
  timedTextMode,
  uploadState,
  liveState,
  LiveModeType,
  thumbnailMockFactory,
  useThumbnail,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { useVideo } from 'api/useVideos';
import { createPlayer } from 'components/common/Player/createPlayer';

import { VideoPlayer } from '.';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('components/common/Player/createPlayer', () => ({
  createPlayer: jest.fn(),
}));
jest.mock('utils/resumeLive', () => ({
  resumeLive: jest.fn().mockResolvedValue(null),
}));
jest.mock('video.js', () => ({
  __esModule: true,
  default: {
    getPlayers: () => [
      {
        currentSource: () => 'https://live.m3u8',
        src: jest.fn(),
      },
    ],
  },
}));

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

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
jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({ video: mockVideo }),
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
      addTrack: jest.fn(),
      removeTrack: jest.fn(),
      destroy: jest.fn(),
      getSource: jest.fn(),
      setSource: jest.fn(),
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
        playerType="videojs"
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
        'en',
        expect.any(Function),
      ),
    );

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
    expect(screen.queryByText('Webinar is paused')).not.toBeInTheDocument();
  });

  it('renders a live video without mp4 or thumbnails', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
    });

    const { container } = render(
      <VideoPlayer video={video} playerType="videojs" timedTextTracks={[]} />,
    );
    await waitFor(() =>
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        video,
        'en',
        expect.any(Function),
      ),
    );

    const videoElement = container.querySelector('video');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement?.poster).toEqual('');
  });

  it('renders correct thumbnail video', async () => {
    const mockThumbnail = thumbnailMockFactory({
      is_ready_to_show: true,
      urls: {
        1080: 'https://example.com/another-thumbnail/1080p.jpg',
      },
    });

    const mockVideoThumb = {
      ...mockVideo,
      thumbnail: mockThumbnail,
    };

    useThumbnail.getState().addResource(mockThumbnail);

    const { container } = render(
      <VideoPlayer
        video={mockVideoThumb}
        playerType="videojs"
        timedTextTracks={[]}
      />,
    );
    await waitFor(() =>
      // The player is created and initialized with DashJS for adaptive bitrate
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        mockVideoThumb,
        'en',
        expect.any(Function),
      ),
    );

    const videoElement = container.querySelector('video');
    expect(videoElement?.poster).toEqual(
      'https://example.com/another-thumbnail/1080p.jpg',
    );
  });

  it('checks refetch video after a thumbnail is deleted', async () => {
    const mockThumbnail = thumbnailMockFactory({
      is_ready_to_show: true,
      urls: {
        1080: 'https://example.com/another-thumbnail/1080p.jpg',
      },
    });

    const mockVideoThumb = {
      ...mockVideo,
      thumbnail: mockThumbnail,
    };

    fetchMock.mock(`/api/videos/video-id/`, mockVideoThumb);

    useThumbnail.getState().addResource(mockThumbnail);

    const WrapperVideo = () => {
      const { data } = useVideo('video-id');

      if (!data) {
        return null;
      }

      return (
        <VideoPlayer video={data} playerType="videojs" timedTextTracks={[]} />
      );
    };

    const { container } = render(<WrapperVideo />);

    await waitFor(() =>
      // The player is created and initialized with DashJS for adaptive bitrate
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'videojs',
        expect.any(Element),
        expect.anything(),
        mockVideoThumb,
        'en',
        expect.any(Function),
      ),
    );

    const videoElement = container.querySelector('video');
    expect(videoElement?.poster).toEqual(
      'https://example.com/another-thumbnail/1080p.jpg',
    );

    fetchMock.mock(`/api/videos/video-id/`, mockVideo, {
      overwriteRoutes: true,
    });

    act(() => {
      useThumbnail.getState().removeResource(mockThumbnail);
    });

    await waitFor(() => {
      expect(
        fetchMock.calls('/api/videos/video-id/', { method: 'GET' }).length,
      ).toEqual(2);
    });

    expect(videoElement?.poster).toEqual(
      'https://example.com/thumbnail/1080p.jpg',
    );
  });
});

import { render, wait } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { appData } from '../../data/appData';
import { isHlsSupported, isMSESupported } from '../../utils/isAbrSupported';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { jestMockOf } from '../../utils/types';
import { VideoPlayer } from './index';

jest.mock('jwt-decode', () => jest.fn());

const mockInitialize = jest.fn();
const mockUpdateSettings = jest.fn();
jest.mock('dashjs', () => ({
  MediaPlayer: () => ({
    create: () => ({
      initialize: mockInitialize,
      updateSettings: mockUpdateSettings,
    }),
  }),
}));

jest.mock('../../utils/isAbrSupported', () => ({
  isHlsSupported: jest.fn(),
  isMSESupported: jest.fn(),
}));
const mockIsMSESupported = isMSESupported as jestMockOf<typeof isMSESupported>;
const mockIsHlsSupported = isHlsSupported as jestMockOf<typeof isHlsSupported>;

const createPlayer = jest.fn();

jest.mock('../../data/appData', () => ({
  appData: {
    video: {
      description: 'Some description',
      id: 'video-id',
      is_ready_to_play: true,
      show_download: false,
      thumbnail: null,
      timed_text_tracks: [
        {
          active_stamp: 1549385921,
          id: 'ttt-1',
          is_ready_to_play: true,
          language: 'fr',
          mode: 'st',
          upload_state: 'ready',
          url: 'https://example.com/timedtext/ttt-1.vtt',
        },
        {
          active_stamp: 1549385922,
          id: 'ttt-2',
          is_ready_to_play: false,
          language: 'fr',
          mode: 'st',
          upload_state: 'ready',
          url: 'https://example.com/timedtext/ttt-2.vtt',
        },
        {
          active_stamp: 1549385923,
          id: 'ttt-3',
          is_ready_to_play: true,
          language: 'en',
          mode: 'cc',
          upload_state: 'ready',
          url: 'https://example.com/timedtext/ttt-3.vtt',
        },
        {
          active_stamp: 1549385924,
          id: 'ttt-4',
          is_ready_to_play: true,
          language: 'fr',
          mode: 'ts',
          upload_state: 'ready',
          url: 'https://example.com/timedtext/ttt-4.vtt',
        },
      ],
      title: 'Some title',
      upload_state: 'ready',
      urls: {
        manifests: {
          dash: 'https://example.com/dash.mpd',
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {
          144: 'https://example.com/144p.mp4',
          1080: 'https://example.com/1080p.mp4',
        },
        thumbnails: {
          720: 'https://example.com/144p.jpg',
        },
      },
    },
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
    createPlayer.mockResolvedValue({
      destroy: jest.fn(),
    });
  });

  afterEach(fetchMock.restore);
  afterEach(jest.clearAllMocks);

  it('starts up the player with DashJS and renders all the relevant sources', async () => {
    // Simulate a browser that supports MSE and will use DashJS
    mockIsMSESupported.mockReturnValue(true);
    mockIsHlsSupported.mockReturnValue(false);

    const { container, getByText, queryByText } = render(
      wrapInIntlProvider(
        <VideoPlayer createPlayer={createPlayer} video={appData.video} />,
      ),
    );
    await wait();

    // The player is created and initialized with DashJS for adaptive bitrate
    expect(createPlayer).toHaveBeenCalledWith(
      'plyr',
      expect.any(Element),
      expect.anything(),
    );
    expect(mockInitialize).toHaveBeenCalledWith(
      expect.any(Element),
      'https://example.com/dash.mpd',
      false,
    );
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      streaming: {
        abr: {
          initialBitrate: {
            video: 1600000,
          },
        },
      },
    });
    expect(queryByText(/Download this video/i)).toEqual(null);
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
    expect(container.querySelector('video')!.tabIndex).toEqual(-1);
  });

  it('allows video download when the video object specifies it', async () => {
    mockIsMSESupported.mockReturnValue(false);
    appData.video!.show_download = true;

    const { getByText } = render(
      wrapInIntlProvider(
        <VideoPlayer createPlayer={createPlayer} video={appData.video} />,
      ),
    );
    await wait();

    getByText(/Download this video/i);
    getByText('Show a transcript');
  });

  it('does not use DashJS when MSE are not supported', async () => {
    // Simulate a browser that does not support MSE
    mockIsMSESupported.mockReturnValue(false);
    const { container } = render(
      wrapInIntlProvider(
        <VideoPlayer createPlayer={createPlayer} video={appData.video} />,
      ),
    );
    await wait();

    // The player is created and initialized with DashJS for adaptive bitrate
    expect(createPlayer).toHaveBeenCalledWith(
      'plyr',
      expect.any(Element),
      expect.anything(),
    );
    expect(mockInitialize).not.toHaveBeenCalled();
    expect(mockUpdateSettings).not.toHaveBeenCalled();
    expect(container.querySelectorAll('source[type="video/mp4"]')).toHaveLength(
      2,
    );
  });

  it('uses HLS source when browser support it', async () => {
    mockIsHlsSupported.mockReturnValue(true);

    const { container } = render(
      wrapInIntlProvider(
        <VideoPlayer createPlayer={createPlayer} video={appData.video} />,
      ),
    );
    await wait();

    expect(container.querySelectorAll('source[type="video/mp4"]')).toHaveLength(
      0,
    );
    expect(
      container.querySelectorAll(
        'source[type="application/vnd.apple.mpegURL"]',
      ),
    ).toHaveLength(1);
  });
});

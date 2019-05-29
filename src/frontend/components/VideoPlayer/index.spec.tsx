import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { bootstrapStore } from '../../data/bootstrapStore';
import { appState } from '../../types/AppData';
import { timedTextMode, uploadState, Video } from '../../types/tracks';
import { isMSESupported } from '../../utils/isAbrSupported';
import { jestMockOf } from '../../utils/types';
import { VideoPlayer } from './index';

jest.mock('jwt-decode', () => jest.fn());

const mockInitialize = jest.fn();
const mockSetInitialBitrateFor = jest.fn();
jest.mock('dashjs', () => ({
  MediaPlayer: () => ({
    create: () => ({
      initialize: mockInitialize,
      setInitialBitrateFor: mockSetInitialBitrateFor,
    }),
  }),
}));

jest.mock('../../utils/isAbrSupported', () => ({
  isMSESupported: jest.fn(),
}));
const mockIsMSESupported = isMSESupported as jestMockOf<typeof isMSESupported>;

jest.mock('../../data/appData', () => ({
  appData: {},
}));

describe('VideoPlayer', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  const video = {
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
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-1.vtt',
      },
      {
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_play: false,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-2.vtt',
      },
      {
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_play: true,
        language: 'en',
        mode: timedTextMode.CLOSED_CAPTIONING,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-3.vtt',
      },
      {
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_play: true,
        language: 'fr',
        mode: timedTextMode.TRANSCRIPT,
        upload_state: uploadState.READY,
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
  } as Video;

  const createPlayer = jest.fn(() => ({
    destroy: jest.fn(),
  }));

  it('starts up the player with DashJS and renders all the relevant sources', () => {
    // Simulate a browser that supports MSE and will use DashJS
    mockIsMSESupported.mockReturnValue(true);
    const state = {
      jwt: 'jwt-token',
      state: appState.INSTRUCTOR,
      video,
    } as any;

    const { container, getByText, queryByText } = render(
      <Provider store={bootstrapStore(state)}>
        <VideoPlayer createPlayer={createPlayer} video={video} />
      </Provider>,
    );

    // The player is created and initialized with DashJS for adaptive bitrate
    expect(createPlayer).toHaveBeenCalledWith(
      'plyr',
      expect.any(Element),
      'jwt-token',
      expect.anything(),
    );
    expect(mockInitialize).toHaveBeenCalledWith(
      expect.any(Element),
      'https://example.com/dash.mpd',
      false,
    );
    expect(mockSetInitialBitrateFor).toHaveBeenCalledWith('video', 1600000);
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
  });

  it('allows video download when the video object specifies it', () => {
    mockIsMSESupported.mockReturnValue(false);
    const state = {
      jwt: 'jwt-token',
      state: appState.INSTRUCTOR,
      video: {
        ...video,
        show_download: true,
      },
    } as any;

    const { getByText } = render(
      <Provider store={bootstrapStore(state)}>
        <VideoPlayer createPlayer={createPlayer} video={video} />
      </Provider>,
    );

    getByText(/Download this video/i);
    getByText('Show a transcript');
  });

  it('does not use DashJS when MSE are not supported', () => {
    // Simulate a browser that does not support MSE
    mockIsMSESupported.mockReturnValue(false);
    const state = {
      jwt: 'jwt-token',
      state: appState.INSTRUCTOR,
      video,
    } as any;

    const { container } = render(
      <Provider store={bootstrapStore(state)}>
        <VideoPlayer createPlayer={createPlayer} video={video} />
      </Provider>,
    );

    // The player is created and initialized with DashJS for adaptive bitrate
    expect(createPlayer).toHaveBeenCalledWith(
      'plyr',
      expect.any(Element),
      'jwt-token',
      expect.anything(),
    );
    expect(mockInitialize).not.toHaveBeenCalled();
    expect(mockSetInitialBitrateFor).not.toHaveBeenCalled();
    expect(container.querySelectorAll('source[type="video/mp4"]')).toHaveLength(
      2,
    );
  });
});

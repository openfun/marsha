/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { waitFor } from '@testing-library/react';
import {
  liveMockFactory,
  liveState,
  timedTextMode,
  uploadState,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';
import videojs from 'video.js';

import { isMSESupported } from '@lib-video/utils/isMSESupported';

import { VideoPlayer } from '../VideoPlayer';

import { createPlayer } from './createPlayer';
import { createVideojsPlayer } from './createVideojsPlayer';

jest.mock('./createPlayer', () => ({
  createPlayer: jest.fn(),
}));

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    attendanceDelay: 10,
    video: mockVideo,
  }),
  decodeJwt: () => ({}),
  XAPIStatement: jest.fn(),
}));

jest.mock('api/pushAttendance', () => ({
  pushAttendance: jest.fn(),
}));

jest.mock('utils/isMSESupported', () => ({
  isMSESupported: jest.fn(),
}));

const mockIsMSESupported = isMSESupported as jest.MockedFunction<
  typeof isMSESupported
>;

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

// It prevents console to display error when it tries to play a non existing media
jest.spyOn(console, 'error').mockImplementation(() => jest.fn());
jest.spyOn(console, 'log').mockImplementation(() => jest.fn());

const mockVideo = videoMockFactory({
  id: 'video-test-videojs-instance',
  timed_text_tracks: [
    {
      active_stamp: 1549385921,
      id: 'ttt-1',
      is_ready_to_show: true,
      language: 'fr',
      mode: timedTextMode.SUBTITLE,
      upload_state: uploadState.READY,
      source_url: 'https://example.com/timedtext/ttt-1.vtt',
      url: 'https://example.com/timedtext/ttt-1.vtt',
      title: 'test',
      video: 'video-test-videojs-instance',
    },
    {
      active_stamp: 1549385922,
      id: 'ttt-2',
      is_ready_to_show: true,
      language: 'fr',
      mode: timedTextMode.CLOSED_CAPTIONING,
      upload_state: uploadState.READY,
      source_url: 'https://example.com/timedtext/ttt-2.vtt',
      url: 'https://example.com/timedtext/ttt-2.vtt',
      title: 'test',
      video: 'video-test-videojs-instance',
    },
  ],
});

describe('createVideoJsPlayer', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'foo',
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    // dispose all not disposed players
    videojs.getAllPlayers().forEach((player) => {
      if (!player.isDisposed()) {
        player.dispose();
      }
    });
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('creates videojs player and configures it', async () => {
    mockIsMSESupported.mockReturnValue(true);
    const { container } = render(
      <VideoPlayer
        video={mockVideo}
        playerType="videojs"
        timedTextTracks={[]}
      />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    const player = createVideojsPlayer(
      videoElement!,
      jest.fn(),
      mockVideo,
      'en',
    );

    expect(player.currentSources()).toEqual([
      { type: 'application/x-mpegURL', src: 'https://example.com/hls' },
    ]);

    expect(player.options_.playbackRates).toEqual([
      0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4,
    ]);
    expect(player.options_.autoplay).toBe(false);
    expect(player.options_.controls).toBe(true);
    expect(player.options_.debug).toBe(false);
    expect(player.options_.fluid).toBe(true);
    expect(player.options_.language).toEqual('en');
    expect(player.options_.liveui).toBe(false);
    expect(player.options_.responsive).toBe(true);
    expect(player.options_.html5).toEqual({
      vhs: {
        limitRenditionByPlayerDimensions: true,
        overrideNative: true,
        useDevicePixelRatio: true,
      },
      nativeAudioTracks: false,
      nativeVideoTracks: false,
    });
  });

  it('creates videojs player without HLS compat and configures it', async () => {
    mockIsMSESupported.mockReturnValue(false);
    const { container } = render(
      <VideoPlayer
        video={mockVideo}
        playerType="videojs"
        timedTextTracks={[]}
      />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    const player = createVideojsPlayer(
      videoElement!,
      jest.fn(),
      mockVideo,
      'en',
    );

    expect(player.currentSources()).toEqual([
      {
        type: 'video/mp4',
        src: 'https://example.com/mp4/1080',
        size: '1080',
      },
      {
        type: 'video/mp4',
        src: 'https://example.com/mp4/720',
        size: '720',
      },
      {
        type: 'video/mp4',
        src: 'https://example.com/mp4/480',
        size: '480',
      },
      {
        type: 'video/mp4',
        src: 'https://example.com/mp4/240',
        size: '240',
      },
      {
        type: 'video/mp4',
        src: 'https://example.com/mp4/144',
        size: '144',
      },
    ]);

    expect(player.options_.playbackRates).toEqual([
      0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4,
    ]);
    expect(player.options_.controls).toBe(true);
    expect(player.options_.debug).toBe(false);
    expect(player.options_.fluid).toBe(true);
    expect(player.options_.language).toEqual('en');
    expect(player.options_.liveui).toBe(false);
    expect(player.options_.responsive).toBe(true);
    expect(player.options_.html5).toEqual({
      vhs: {
        limitRenditionByPlayerDimensions: true,
        overrideNative: true,
        useDevicePixelRatio: true,
      },
      nativeAudioTracks: false,
      nativeVideoTracks: false,
    });
    expect(player.options_.plugins).toEqual({
      qualitySelector: {
        default: '480',
      },
    });
  });

  it('configures for a live video', async () => {
    mockIsMSESupported.mockReturnValue(true);
    const video = liveMockFactory({
      urls: {
        manifests: {
          hls: 'https://example.com/hls',
        },
        mp4: {},
        thumbnails: {},
      },
      live_state: liveState.RUNNING,
    });
    const { container } = render(
      <VideoPlayer video={video} playerType="videojs" timedTextTracks={[]} />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    const player = createVideojsPlayer(videoElement!, jest.fn(), video, 'en');

    expect(player.currentSources()).toEqual([
      { type: 'application/x-mpegURL', src: 'https://example.com/hls' },
    ]);
    expect(player.options_.autoplay).toBe(true);
    expect(player.options_.liveui).toBe(true);
    expect(player.options_.playbackRates).toEqual([]);
  });
});

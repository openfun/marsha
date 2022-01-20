import { render, waitFor } from '@testing-library/react';
import React from 'react';
import videojs from 'video.js';

import VideoPlayer from 'components/VideoPlayer';
import { useTranscriptTimeSelector } from 'data/stores/useTranscriptTimeSelector';
import { liveState, timedTextMode, uploadState } from 'types/tracks';
import { isMSESupported } from 'utils/isMSESupported';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { VideoXAPIStatementInterface, XAPIStatement } from 'XAPI';

import { createVideojsPlayer } from './createVideojsPlayer';
import { createPlayer } from './createPlayer';

const mockXAPIStatementInterface: VideoXAPIStatementInterface = {
  initialized: jest.fn(),
  completed: jest.fn(),
  downloaded: jest.fn(),
  interacted: jest.fn(),
  paused: jest.fn(),
  played: jest.fn(),
  seeked: jest.fn(),
  terminated: jest.fn(),
};

jest.mock('../XAPI', () => ({
  XAPIStatement: jest.fn(),
}));

const mockXAPIStatement = XAPIStatement as jest.MockedFunction<
  typeof XAPIStatement
>;
mockXAPIStatement.mockReturnValue(mockXAPIStatementInterface);

jest.mock('./createPlayer', () => ({
  createPlayer: jest.fn(),
}));
jest.mock('../utils/isMSESupported', () => ({
  isMSESupported: jest.fn(),
}));

const mockIsMSESupported = isMSESupported as jest.MockedFunction<
  typeof isMSESupported
>;

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

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

jest.mock('../data/appData', () => ({
  appData: {
    jwt: 'foo',
    video: mockVideo,
  },
  getDecodedJwt: jest.fn().mockImplementation(() => ({
    locale: 'en',
    session_id: 'abcd',
  })),
}));
jest.mock('../index', () => ({
  intl: {
    locale: 'fr',
  },
}));

jest.mock('../data/stores/useTimedTextTrackLanguageChoices', () => ({
  useTimedTextTrackLanguageChoices: () => ({
    getChoices: jest.fn(),
    choices: [],
  }),
}));

describe('createVideoJsPlayer', () => {
  afterEach(() => {
    // dispose all not disposed players
    videojs.getAllPlayers().forEach((player) => {
      if (!player.isDisposed()) {
        player.dispose();
      }
    });
    // remove all subscribers
    useTranscriptTimeSelector.destroy();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates videojs player and configures it', async () => {
    mockIsMSESupported.mockReturnValue(true);
    const { container } = render(
      wrapInIntlProvider(
        <VideoPlayer
          video={mockVideo}
          playerType={'videojs'}
          timedTextTracks={[]}
        />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    const player = createVideojsPlayer(videoElement!, jest.fn(), mockVideo);

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
    expect(player.options_.language).toEqual('fr');
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
      wrapInIntlProvider(
        <VideoPlayer
          video={mockVideo}
          playerType={'videojs'}
          timedTextTracks={[]}
        />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    const player = createVideojsPlayer(videoElement!, jest.fn(), mockVideo);

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
    expect(player.options_.language).toEqual('fr');
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
    const video = videoMockFactory({
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
      wrapInIntlProvider(
        <VideoPlayer
          video={video}
          playerType={'videojs'}
          timedTextTracks={[]}
        />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    const player = createVideojsPlayer(videoElement!, jest.fn(), video);

    expect(player.currentSources()).toEqual([
      { type: 'application/x-mpegURL', src: 'https://example.com/hls' },
    ]);
    expect(player.options_.autoplay).toBe(true);
    expect(player.options_.liveui).toBe(true);
    expect(player.options_.playbackRates).toEqual([]);
  });

  it('sends xapi events', async () => {
    const { container } = render(
      wrapInIntlProvider(
        <VideoPlayer
          video={mockVideo}
          playerType={'videojs'}
          timedTextTracks={[]}
        />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');
    const dispatchPlayerTimeUpdate = jest.fn();

    const player = createVideojsPlayer(
      videoElement!,
      dispatchPlayerTimeUpdate,
      mockVideo,
    );

    expect(mockXAPIStatement).toHaveBeenCalled();

    player.trigger('canplaythrough');
    expect(mockXAPIStatementInterface.initialized).toHaveBeenCalled();

    player.trigger('play');
    expect(mockXAPIStatementInterface.played).toHaveBeenCalled();

    player.trigger('pause');
    expect(mockXAPIStatementInterface.paused).toHaveBeenCalled();

    player.trigger('timeupdate');
    expect(dispatchPlayerTimeUpdate).toHaveBeenCalled();

    // calling seeked without seeking before should not
    // send xapi statement
    player.trigger('seeked');
    expect(mockXAPIStatementInterface.seeked).not.toHaveBeenCalled();

    player.trigger('seeking');
    player.trigger('seeked');
    expect(mockXAPIStatementInterface.seeked).toHaveBeenCalled();

    player.trigger('fullscreenchange');
    player.trigger('languagechange');
    player.trigger('ratechange');
    player.trigger('volumechange');
    player.qualityLevels().trigger('change');
    player.remoteTextTracks().dispatchEvent(new Event('change'));
    expect(mockXAPIStatementInterface.interacted).toHaveBeenCalledTimes(6);

    window.dispatchEvent(new Event('unload'));
    expect(mockXAPIStatementInterface.terminated).toHaveBeenCalled();
  });

  it('changes current time when useTranscriptTimeSelector is modified', async () => {
    const video = videoMockFactory();

    const { container } = render(
      wrapInIntlProvider(
        <VideoPlayer
          video={video}
          playerType={'videojs'}
          timedTextTracks={[]}
        />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    const player = createVideojsPlayer(videoElement!, jest.fn(), video);

    // when the video is not played yet, the currentTime
    // is not modified. It is the initTime that is modified.
    // Playing a video in our tests is not possible because we don't have
    // a real browser implementing media sources.
    // If cache_.initTime is modified, we know player.currentTime(seconds)
    // has been called.
    expect(player.cache_.initTime).toEqual(0);

    useTranscriptTimeSelector.getState().setTime(10);

    expect(player.cache_.initTime).toEqual(10);
  });
});

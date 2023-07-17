/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { waitFor } from '@testing-library/react';
import {
  Id3VideoType,
  VideoXAPIStatementInterface,
  XAPIStatement,
  liveMockFactory,
  liveState,
  timedTextMode,
  uploadState,
  useJwt,
  useVideo,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';
import videojs from 'video.js';

import { pushAttendance } from '@lib-video/api/pushAttendance';
import { useTranscriptTimeSelector } from '@lib-video/hooks/useTranscriptTimeSelector';
import { getOrInitAnonymousId } from '@lib-video/utils/getOrInitAnonymousId';
import { isMSESupported } from '@lib-video/utils/isMSESupported';

import { VideoPlayer } from '../VideoPlayer';

import { createPlayer } from './createPlayer';
import { createVideojsPlayer } from './createVideojsPlayer';

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
const mockXAPIStatement = XAPIStatement as jest.MockedFunction<
  typeof XAPIStatement
>;
mockXAPIStatement.mockReturnValue(mockXAPIStatementInterface);

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

const mockPushAttendance = pushAttendance as jest.MockedFunction<
  typeof pushAttendance
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

  it('sends xapi events', async () => {
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
    const dispatchPlayerTimeUpdate = jest.fn();

    const player = createVideojsPlayer(
      videoElement!,
      dispatchPlayerTimeUpdate,
      mockVideo,
      'en',
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

  it('start and end id3 listening', async () => {
    expect(useVideo.getState().isWatchingVideo).toBe(false);
    mockIsMSESupported.mockReturnValue(false);

    const video = liveMockFactory({
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://google.com',
        },
        mp4: {},
        thumbnails: {},
      },
    });
    const { container } = render(
      <VideoPlayer video={video} playerType="videojs" timedTextTracks={[]} />,
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
      video,
      'en',
    );

    await waitFor(() => {
      expect(useVideo.getState().isWatchingVideo).toBe(true);
    });

    player.trigger('dispose');
    expect(useVideo.getState().isWatchingVideo).toBe(false);
  });

  it('load id3 tags', async () => {
    mockIsMSESupported.mockReturnValue(false);

    const video = liveMockFactory({
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://google.com',
        },
        mp4: {},
        thumbnails: {},
      },
    });

    const { container } = render(
      <VideoPlayer video={video} playerType="videojs" timedTextTracks={[]} />,
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
      video,
      'en',
    );

    await waitFor(() => {
      expect(useVideo.getState().isWatchingVideo).toBe(true);
    });

    // Create listened track
    player.addTextTrack('metadata', 'Timed Metadata', 'en');
    const id3Video: Id3VideoType = {
      live_state: liveState.RUNNING,
      active_shared_live_media: {
        id: '1234',
      },
      active_shared_live_media_page: null,
    } as any;
    const tracks = player.textTracks();
    const track = tracks[0];
    player.trigger('loadedmetadata');

    // Add cue that should come from id3 tags
    const newCue = new VTTCue(0, 2, JSON.stringify({ video: id3Video }));
    track.addCue(newCue);

    // track should contain trigger function but is not typescritped
    const trackTrigger = track as any as {
      trigger: (eventName: string) => void;
    };
    if (trackTrigger && trackTrigger.trigger) {
      trackTrigger.trigger('cuechange');
    }

    await waitFor(() => {
      expect(useVideo.getState().id3Video).toStrictEqual(id3Video);
    });

    player.trigger('dispose');
    expect(useVideo.getState().id3Video).toBe(null);
  });

  it('changes current time when useTranscriptTimeSelector is modified', async () => {
    const video = liveMockFactory();

    const { container } = render(
      <VideoPlayer video={video} playerType="videojs" timedTextTracks={[]} />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    const player = createVideojsPlayer(videoElement!, jest.fn(), video, 'en');

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

  it('sends attendance for a student watching a live', async () => {
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
      can_edit: false,
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

    expect(player.options_.liveui).toBe(true);

    expect(mockPushAttendance).not.toHaveBeenCalled();
    // to initialize the video for a live
    player.qualityLevels().trigger('change');
    Date.now = jest.fn(() => 1651732370000);
    jest.runOnlyPendingTimers();
    expect(mockPushAttendance).toHaveBeenCalledWith(
      video.id,
      {
        1651732370: {
          fullScreen: false,
          muted: false,
          player_timer: 0,
          playing: false,
          timestamp: 1651732370000,
          volume: 1,
        },
      },
      'en',
      getOrInitAnonymousId(),
    );
    jest.runOnlyPendingTimers();
    expect(mockPushAttendance).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new Event('unload'));

    jest.runOnlyPendingTimers();

    // it didn't get called a new time
    expect(mockPushAttendance).toHaveBeenCalledTimes(2);
  });

  it("doesn't send attendance for an admin or instructor watching a live", async () => {
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
    expect(player.options_.liveui).toBe(true);

    // to initialize the video for a live
    player.qualityLevels().trigger('change');
    expect(mockPushAttendance).not.toHaveBeenCalled();
  });

  it("doesn't send attendance when it's not a live", async () => {
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

    player.trigger('canplaythrough');
    expect(mockPushAttendance).not.toHaveBeenCalled();
  });
});

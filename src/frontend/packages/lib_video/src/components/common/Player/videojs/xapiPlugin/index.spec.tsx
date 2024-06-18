/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { waitFor } from '@testing-library/react';
import {
  VideoXAPIStatementInterface,
  XAPIStatement,
  liveState,
  timedTextMode,
  uploadState,
  useJwt,
} from 'lib-components';
import { liveMockFactory, videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';
import videojs from 'video.js';

import { pushAttendance } from '@lib-video/api/pushAttendance';
import { getOrInitAnonymousId } from '@lib-video/utils/getOrInitAnonymousId';

import { VideoPlayer } from '../../../VideoPlayer';
import { createPlayer } from '../../createPlayer';
import { createVideojsPlayer } from '../../createVideojsPlayer';
import { Events } from '../downloadVideoPlugin/types';

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

jest.mock('../../createPlayer', () => ({
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
  isMSESupported: jest.fn().mockReturnValue(true),
}));

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

describe('XAPI plugin', () => {
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

    player.trigger(Events.DOWNLOAD);
    expect(mockXAPIStatementInterface.downloaded).toHaveBeenCalled();

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

  it('sends attendance for a student watching a live', async () => {
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

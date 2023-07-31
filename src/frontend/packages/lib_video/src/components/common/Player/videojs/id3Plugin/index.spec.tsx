/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { waitFor } from '@testing-library/react';
import {
  Id3VideoType,
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

import { VideoPlayer } from '../../../VideoPlayer';
import { createPlayer } from '../../createPlayer';
import { createVideojsPlayer } from '../../createVideojsPlayer';

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

jest.mock('utils/isMSESupported', () => ({
  isMSESupported: jest.fn().mockReturnValue(false),
}));

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

describe('Id3 Plugin', () => {
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

  it('start and end id3 listening', async () => {
    expect(useVideo.getState().isWatchingVideo).toBe(false);

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
    };
    player.trigger('loadedmetadata');

    const tracks = player.textTracks();
    const track = tracks[0];
    console.log(tracks);
    // Add cue that should come from id3 tags
    const newCue = new VTTCue(0, 2, JSON.stringify({ video: id3Video }));
    track.addCue(newCue);

    // track should contain trigger function but is not typescritped
    const trackTrigger = track as any as {
      trigger: (eventName: string) => void;
    } & TextTrack;
    if (trackTrigger && trackTrigger.trigger) {
      trackTrigger.trigger('cuechange');
    }

    await waitFor(() => {
      expect(useVideo.getState().id3Video).toStrictEqual(id3Video);
    });

    player.trigger('dispose');
    expect(useVideo.getState().id3Video).toBe(null);
  });
});

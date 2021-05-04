import { render } from '@testing-library/react';
import React from 'react';
import { mocked } from 'ts-jest/utils';

import VideoPlayer from '../components/VideoPlayer';

import { createVideojsPlayer } from './createVideojsPlayer';
import { liveState, timedTextMode, uploadState } from '../types/tracks';
import { isMSESupported } from '../utils/isMSESupported';
import { jestMockOf } from '../utils/types';
import { videoMockFactory } from '../utils/tests/factories';
import { wrapInIntlProvider } from '../utils/tests/intl';
import { XAPIStatement } from '../XAPI/XAPIStatement';

jest.mock('../XAPI/XAPIStatement');

jest.mock('./createPlayer', () => ({
  createPlayer: jest.fn(),
}));
jest.mock('../utils/isMSESupported', () => ({
  isMSESupported: jest.fn(),
}));

const mockIsMSESupported = isMSESupported as jestMockOf<typeof isMSESupported>;

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
    static: {
      svg: {
        plyr: '/static/svg/plyr.svg',
      },
    },
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
  const XAPIStatementMocked = mocked(XAPIStatement);
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates videojs player and configures it', () => {
    mockIsMSESupported.mockReturnValue(true);
    const { container } = render(
      wrapInIntlProvider(
        <VideoPlayer video={mockVideo} playerType={'videojs'} />,
      ),
    );

    const videoElement = container.querySelector('video');

    const player = createVideojsPlayer(
      videoElement!,
      jest.fn(),
      mockVideo.urls!,
      mockVideo.live_state,
    );

    expect(player.currentSources()).toEqual([
      { type: 'application/x-mpegURL', src: 'https://example.com/hls' },
    ]);

    expect(player.options_.playbackRates).toEqual([
      0.5,
      0.75,
      1,
      1.25,
      1.5,
      1.75,
      2,
      4,
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
  });

  it('creates videojs player without HLS compat and configures it', () => {
    mockIsMSESupported.mockReturnValue(false);
    const { container } = render(
      wrapInIntlProvider(
        <VideoPlayer video={mockVideo} playerType={'videojs'} />,
      ),
    );

    const videoElement = container.querySelector('video');

    const player = createVideojsPlayer(
      videoElement!,
      jest.fn(),
      mockVideo.urls!,
      mockVideo.live_state,
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
      0.5,
      0.75,
      1,
      1.25,
      1.5,
      1.75,
      2,
      4,
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

  it('configures for a live video', () => {
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
      wrapInIntlProvider(<VideoPlayer video={video} playerType={'videojs'} />),
    );

    const videoElement = container.querySelector('video');

    const player = createVideojsPlayer(
      videoElement!,
      jest.fn(),
      video.urls!,
      video.live_state,
    );

    expect(player.currentSources()).toEqual([
      { type: 'application/x-mpegURL', src: 'https://example.com/hls' },
    ]);
    expect(player.options_.liveui).toBe(true);
  });

  it('sends xapi events', () => {
    const { container } = render(
      wrapInIntlProvider(
        <VideoPlayer video={mockVideo} playerType={'videojs'} />,
      ),
    );

    const videoElement = container.querySelector('video');
    const dispatchPlayerTimeUpdate = jest.fn();

    const player = createVideojsPlayer(
      videoElement!,
      dispatchPlayerTimeUpdate,
      mockVideo.urls!,
      mockVideo.live_state,
    );

    expect(XAPIStatementMocked).toHaveBeenCalled();
    const XapiStatementInstance = XAPIStatementMocked.mock.instances[0];

    player.trigger('canplaythrough');
    expect(XapiStatementInstance.initialized).toHaveBeenCalled();

    player.trigger('playing');
    expect(XapiStatementInstance.played).toHaveBeenCalled();

    player.trigger('pause');
    expect(XapiStatementInstance.paused).toHaveBeenCalled();

    player.trigger('timeupdate');
    expect(dispatchPlayerTimeUpdate).toHaveBeenCalled();

    // calling seeked without seeking before should not
    // send xapi statement
    player.trigger('seeked');
    expect(XapiStatementInstance.seeked).not.toHaveBeenCalled();

    player.trigger('seeking');
    player.trigger('seeked');
    expect(XapiStatementInstance.seeked).toHaveBeenCalled();

    player.trigger('fullscreenchange');
    player.trigger('languagechange');
    player.trigger('ratechange');
    player.trigger('volumechange');
    player.qualityLevels().trigger('change');
    player.remoteTextTracks().dispatchEvent(new Event('change'));
    expect(XapiStatementInstance.interacted).toHaveBeenCalledTimes(6);

    window.dispatchEvent(new Event('unload'));
    expect(XapiStatementInstance.terminated).toHaveBeenCalled();
  });
});

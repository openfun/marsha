/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { timedTextMode, useJwt, useTimedTextTrack } from 'lib-components';
import {
  liveMockFactory,
  timedTextMockFactory,
  videoMockFactory,
} from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { useTranscriptTimeSelector } from '@lib-video/hooks/useTranscriptTimeSelector';

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
  isMSESupported: jest.fn().mockReturnValue(true),
}));

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

// It prevents console to display error when it tries to play a non existing media
jest.spyOn(console, 'error').mockImplementation(() => jest.fn());
jest.spyOn(console, 'log').mockImplementation(() => jest.fn());

const mockVideo = videoMockFactory({
  id: '1234',
});

jest.mock('utils/isMSESupported', () => ({
  isMSESupported: jest.fn().mockReturnValue(true),
}));

describe('Transcript Plugin', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: false,
          },
        }) as any,
    });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.clearAllMocks();
  });

  it('displays the video player without transcript', async () => {
    const video = videoMockFactory({
      ...mockVideo,
      show_download: false,
      has_transcript: false,
      shared_live_medias: [],
    });

    const { container } = render(
      <VideoPlayer video={video} playerType="videojs" timedTextTracks={[]} />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    createVideojsPlayer(videoElement!, jest.fn(), video, 'en');

    await screen.findByRole('button', {
      name: 'Fullscreen',
    });
    screen.getByRole('button', {
      name: 'Transcript',
    });

    expect(
      screen.queryByRole('menuitemradio', {
        name: 'transcript off',
      }),
    ).not.toBeInTheDocument();
  });

  it('displays the video player with transcript plugin', async () => {
    const timedTextTracks = [
      timedTextMockFactory({
        language: 'fr',
        is_ready_to_show: true,
        mode: timedTextMode.TRANSCRIPT,
      }),
    ];
    useTimedTextTrack.getState().addMultipleResources(timedTextTracks);
    const video = videoMockFactory({
      ...mockVideo,
      has_transcript: true,
      show_download: true,
      timed_text_tracks: timedTextTracks,
    });

    const { container } = render(
      <VideoPlayer
        video={video}
        playerType="videojs"
        timedTextTracks={timedTextTracks}
      />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    createVideojsPlayer(videoElement!, jest.fn(), video, 'en');

    await screen.findByRole('button', {
      name: 'Fullscreen',
    });
    screen.getByRole('button', {
      name: 'Transcript',
    });

    const menuitemTranscript = screen.getByRole('menuitemradio', {
      name: 'fr',
    });
    expect(menuitemTranscript).toBeInTheDocument();
    menuitemTranscript.click();
    expect(useTimedTextTrack.getState().selectedTranscript).toEqual(
      timedTextTracks[0],
    );
    const menuitemTranscriptOff = screen.getByRole('menuitemradio', {
      name: 'transcript off',
    });
    menuitemTranscriptOff.click();
    expect(useTimedTextTrack.getState().selectedTranscript).toEqual(null);
  });

  it('display transcript plugin with subtitles as transcripts', async () => {
    const timedTextTracks = [
      timedTextMockFactory({
        language: 'fr',
        id: 'ttt-1',
        is_ready_to_show: true,
        mode: timedTextMode.SUBTITLE,
      }),
    ];
    useTimedTextTrack.getState().addMultipleResources(timedTextTracks);
    const video = videoMockFactory({
      ...mockVideo,
      has_transcript: false,
      show_download: true,
      should_use_subtitle_as_transcript: true,
      timed_text_tracks: timedTextTracks,
    });

    const { container } = render(
      <VideoPlayer
        video={video}
        playerType="videojs"
        timedTextTracks={timedTextTracks}
      />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    createVideojsPlayer(videoElement!, jest.fn(), video, 'en');

    await screen.findByRole('button', {
      name: 'Fullscreen',
    });
    screen.getByRole('button', {
      name: 'Transcript',
    });

    const menuitemTranscript = screen.getByRole('menuitemradio', {
      name: 'fr',
    });
    expect(menuitemTranscript).toBeInTheDocument();
    menuitemTranscript.click();
    expect(useTimedTextTrack.getState().selectedTranscript).toEqual(
      timedTextTracks[0],
    );
    const menuitemTranscriptOff = screen.getByRole('menuitemradio', {
      name: 'transcript off',
    });
    menuitemTranscriptOff.click();
    expect(useTimedTextTrack.getState().selectedTranscript).toEqual(null);
  });

  it('should not display plugin if video is not live', async () => {
    const timedTextTracks = [
      timedTextMockFactory({
        is_ready_to_show: true,
        mode: timedTextMode.TRANSCRIPT,
      }),
    ];
    useTimedTextTrack.getState().addMultipleResources(timedTextTracks);
    const video = videoMockFactory({
      ...mockVideo,
      is_live: true,
      has_transcript: true,
      show_download: true,
      timed_text_tracks: timedTextTracks,
    });

    const { container } = render(
      <VideoPlayer
        video={video}
        playerType="videojs"
        timedTextTracks={timedTextTracks}
      />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');

    createVideojsPlayer(videoElement!, jest.fn(), video, 'en');

    await screen.findByRole('button', {
      name: 'Fullscreen',
    });
    expect(
      screen.queryByRole('menuitemradio', {
        name: 'transcript off',
      }),
    ).not.toBeInTheDocument();
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
});

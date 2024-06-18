/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { VideoPlayer } from '@lib-video/components/common/VideoPlayer';

import { createPlayer } from '../../createPlayer';
import { createVideojsPlayer } from '../../createVideojsPlayer';

import { DownloadVideoQualityItem } from './components/DownloadVideoQualityItem';
import { Events } from './types';

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

let mockedDownload = jest
  .spyOn(DownloadVideoQualityItem.prototype, 'downloadVideoQuality')
  .mockImplementation();

const mockVideo = videoMockFactory({
  id: '1234',
});

describe('Download Video Plugin', () => {
  beforeEach(() => {
    mockedDownload = jest
      .spyOn(DownloadVideoQualityItem.prototype, 'downloadVideoQuality')
      .mockImplementation();
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

  it('displays the video player without download video button when show download is false', async () => {
    const video = videoMockFactory({
      ...mockVideo,
      show_download: false,
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
    expect(
      screen.queryByRole('button', {
        name: 'Download Video',
      }),
    ).not.toBeInTheDocument();
  });

  it('displays the video player with download video button and items', async () => {
    const video = videoMockFactory({
      ...mockVideo,
    });
    const dispatchPlayerTimeUpdate = jest.fn();

    const { container } = render(
      <VideoPlayer video={video} playerType="videojs" timedTextTracks={[]} />,
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalled(),
    );

    const videoElement = container.querySelector('video');
    const player = createVideojsPlayer(
      videoElement!,
      dispatchPlayerTimeUpdate,
      video,
      'en',
    );
    const handleTrigger = jest.fn();

    await screen.findByRole('button', {
      name: 'Fullscreen',
    });
    screen.getByRole('button', {
      name: 'Download Video',
    });

    const menuItemDownloadQuality = screen.getByRole('menuitem', {
      name: '1080p',
    });
    expect(menuItemDownloadQuality).toBeInTheDocument();
    player.on(Events.DOWNLOAD, handleTrigger);
    menuItemDownloadQuality.click();
    expect(mockedDownload).toHaveBeenCalledWith('https://example.com/mp4/1080');
    expect(handleTrigger).toHaveBeenCalledTimes(1);
  });
});

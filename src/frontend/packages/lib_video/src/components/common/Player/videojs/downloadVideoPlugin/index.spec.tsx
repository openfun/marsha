import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { VideoPlayer } from '@lib-video/components/common/VideoPlayer';

import { DownloadVideoQualityItem } from './components/DownloadVideoQualityItem';

const mockVideo = videoMockFactory({
  id: '1234',
});

jest.mock('utils/isMSESupported', () => ({
  isMSESupported: jest.fn().mockReturnValue(true),
}));

let mockedDownload = jest
  .spyOn(DownloadVideoQualityItem.prototype, 'downloadVideoQuality')
  .mockImplementation();

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

    render(
      <VideoPlayer video={video} playerType="videojs" timedTextTracks={[]} />,
    );

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

    render(
      <VideoPlayer video={video} playerType="videojs" timedTextTracks={[]} />,
    );

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
    menuItemDownloadQuality.click();
    expect(mockedDownload).toHaveBeenCalledWith('https://example.com/mp4/1080');
  });
});

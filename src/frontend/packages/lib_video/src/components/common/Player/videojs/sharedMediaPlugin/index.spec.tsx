/* eslint-disable testing-library/no-node-access */
import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import {
  sharedLiveMediaMockFactory,
  videoMockFactory,
} from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { VideoPlayer } from '@lib-video/components/common/VideoPlayer';

import { SharedMediaItem } from './components/SharedMediaItem';

const mockVideo = videoMockFactory({
  id: '1234',
});

jest.mock('utils/isMSESupported', () => ({
  isMSESupported: jest.fn().mockReturnValue(true),
}));

let mockedDownload = jest
  .spyOn(SharedMediaItem.prototype, 'downloadSharedMediaItem')
  .mockImplementation();

describe('Shared Media Plugin', () => {
  beforeEach(() => {
    mockedDownload = jest
      .spyOn(SharedMediaItem.prototype, 'downloadSharedMediaItem')
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

  it('displays the video player without shared media button', async () => {
    const video = videoMockFactory({
      ...mockVideo,
      shared_live_medias: [],
    });

    render(
      <VideoPlayer video={video} playerType="videojs" timedTextTracks={[]} />,
    );

    await screen.findByRole('button', {
      name: 'Fullscreen',
    });
    expect(
      screen.queryByRole('button', {
        name: 'Shared Media',
      }),
    ).not.toBeInTheDocument();
  });

  it('displays the video player with shared media button and items', async () => {
    const sharedLiveMedia = sharedLiveMediaMockFactory({
      video: mockVideo.id,
      title: 'media title',
    });

    const video = videoMockFactory({
      ...mockVideo,
      shared_live_medias: [sharedLiveMedia],
    });

    render(
      <VideoPlayer video={video} playerType="videojs" timedTextTracks={[]} />,
    );

    await screen.findByRole('button', {
      name: 'Fullscreen',
    });
    screen.getByRole('button', {
      name: 'Shared Media',
    });

    const menuitemTranscript = screen.getByRole('menuitem', {
      name: 'media title',
    });
    expect(menuitemTranscript).toBeInTheDocument();
    menuitemTranscript.click();
    expect(mockedDownload).toHaveBeenCalled();
  });
});

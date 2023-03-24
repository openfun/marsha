import faker from 'faker';
import {
  sharedLiveMediaMockFactory,
  liveMockFactory,
  liveState,
  LiveModeType,
  useVideo,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { SharedMediaCurrentPageProvider } from '@lib-video/hooks/useSharedMediaCurrentPage';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { UpdateCurrentSharedLiveMediaPage } from '.';

const mockSharedCurrentPage = { page: 0, imageUrl: '' };
const mockUseSharedMediaCurrentPage = jest.fn();
jest.mock('hooks/useSharedMediaCurrentPage', () => ({
  useSharedMediaCurrentPage: jest
    .fn()
    .mockImplementation(() => [
      mockSharedCurrentPage,
      mockUseSharedMediaCurrentPage,
    ]),
  SharedMediaCurrentPageProvider: jest.requireActual(
    'hooks/useSharedMediaCurrentPage',
  ).SharedMediaCurrentPageProvider,
}));

describe('<UpdateCurrentSharedLiveMediaPage />', () => {
  it('set the page in the SharedMediaCurrentPageProvider', () => {
    const videoId = faker.datatype.uuid();
    const sharedLiveMedia = sharedLiveMediaMockFactory({ video: videoId });
    const video = liveMockFactory({
      id: videoId,
      active_shared_live_media: sharedLiveMedia,
      active_shared_live_media_page: 1,
      shared_live_medias: [sharedLiveMedia],
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
    });

    const { rerender } = render(
      wrapInVideo(
        <SharedMediaCurrentPageProvider
          value={{
            page: 2,
            imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/2`,
          }}
        >
          <UpdateCurrentSharedLiveMediaPage />
        </SharedMediaCurrentPageProvider>,
        video,
      ),
    );

    expect(mockUseSharedMediaCurrentPage).toHaveBeenCalledWith({
      page: 1,
      imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/1`,
    });

    // it simulates an update of the video object
    rerender(
      wrapInVideo(
        <SharedMediaCurrentPageProvider
          value={{
            page: 2,
            imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/2`,
          }}
        >
          <UpdateCurrentSharedLiveMediaPage />
        </SharedMediaCurrentPageProvider>,
        { ...video, active_shared_live_media_page: 3 },
      ),
    );

    expect(mockUseSharedMediaCurrentPage).toHaveBeenCalledWith({
      page: 3,
      imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/3`,
    });
  });

  it('set the page with id3 tags', () => {
    const videoId = faker.datatype.uuid();
    const sharedLiveMedia = sharedLiveMediaMockFactory({ video: videoId });
    const video = liveMockFactory({
      id: videoId,
      active_shared_live_media: sharedLiveMedia,
      active_shared_live_media_page: 1,
      shared_live_medias: [sharedLiveMedia],
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
    });

    useVideo.getState().setId3Video({
      active_shared_live_media: { id: sharedLiveMedia.id },
      active_shared_live_media_page: 1,
      live_state: liveState.RUNNING,
    });
    useVideo.getState().setIsWatchingVideo(true);

    const { rerender } = render(
      wrapInVideo(
        <SharedMediaCurrentPageProvider
          value={{
            page: 2,
            imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/2`,
          }}
        >
          <UpdateCurrentSharedLiveMediaPage />
        </SharedMediaCurrentPageProvider>,
        video,
      ),
    );

    expect(mockUseSharedMediaCurrentPage).toHaveBeenCalledWith({
      page: 1,
      imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/1`,
    });

    useVideo.getState().setId3Video({
      active_shared_live_media: { id: sharedLiveMedia.id },
      active_shared_live_media_page: 2,
      live_state: liveState.RUNNING,
    });

    // it simulates an update of the video object
    rerender(
      wrapInVideo(
        <SharedMediaCurrentPageProvider
          value={{
            page: 2,
            imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/2`,
          }}
        >
          <UpdateCurrentSharedLiveMediaPage />
        </SharedMediaCurrentPageProvider>,
        { ...video, active_shared_live_media_page: 1 },
      ),
    );

    expect(mockUseSharedMediaCurrentPage).toHaveBeenCalledWith({
      page: 2,
      imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/2`,
    });
  });
});

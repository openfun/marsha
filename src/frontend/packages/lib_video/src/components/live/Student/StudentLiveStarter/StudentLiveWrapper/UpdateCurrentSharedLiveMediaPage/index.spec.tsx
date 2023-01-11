import faker from 'faker';
import {
  sharedLiveMediaMockFactory,
  videoMockFactory,
  liveState,
  LiveModeType,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { SharedMediaCurrentPageProvider } from 'hooks/useSharedMediaCurrentPage';
import { wrapInVideo } from 'utils/wrapInVideo';

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
    const video = videoMockFactory({
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
});

import { render } from '@testing-library/react';
import faker from 'faker';
import React from 'react';

import { SharedMediaCurrentPageProvider } from 'data/stores/useSharedMediaCurrentPage';
import {
  sharedLiveMediaMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import { UpdateCurrentSharedLiveMediaPage } from '.';

const mockSharedCurrentPage = { page: 0, imageUrl: '' };
const mockUseSharedMediaCurrentPage = jest.fn();
jest.mock('data/stores/useSharedMediaCurrentPage', () => ({
  useSharedMediaCurrentPage: jest
    .fn()
    .mockImplementation(() => [
      mockSharedCurrentPage,
      mockUseSharedMediaCurrentPage,
    ]),
  SharedMediaCurrentPageProvider: jest.requireActual(
    'data/stores/useSharedMediaCurrentPage',
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
    });

    const { rerender } = render(
      <SharedMediaCurrentPageProvider
        value={{
          page: 2,
          imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/2`,
        }}
      >
        <UpdateCurrentSharedLiveMediaPage video={video} />
      </SharedMediaCurrentPageProvider>,
    );

    expect(mockUseSharedMediaCurrentPage).toHaveBeenCalledWith({
      page: 1,
      imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/1`,
    });

    // it simulates an update of the video object
    rerender(
      <SharedMediaCurrentPageProvider
        value={{
          page: 2,
          imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/2`,
        }}
      >
        <UpdateCurrentSharedLiveMediaPage
          video={{ ...video, active_shared_live_media_page: 3 }}
        />
      </SharedMediaCurrentPageProvider>,
    );

    expect(mockUseSharedMediaCurrentPage).toHaveBeenCalledWith({
      page: 3,
      imageUrl: `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/3`,
    });
  });
});

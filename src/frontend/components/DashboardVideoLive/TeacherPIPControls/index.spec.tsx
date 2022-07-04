import { screen } from '@testing-library/react';
import React from 'react';
import { uploadState } from 'types/tracks';

import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { TeacherPIPControls } from '.';

jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

const mockCurrentPage = 1;
const mockSetSharedCurrentPage = jest.fn();
jest.mock('data/stores/useSharedMediaCurrentPage', () => ({
  useSharedMediaCurrentPage: () => [mockCurrentPage, mockSetSharedCurrentPage],
}));

describe('<TeacherPIPControls />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders both buttons', () => {
    const video = videoMockFactory();

    render(<TeacherPIPControls video={video} maxPage={4} />);

    screen.getByRole('button', { name: 'Next page' });
    screen.getByRole('button', { name: 'Previous page' });

    expect(mockSetSharedCurrentPage).not.toHaveBeenCalled();
  });

  it('updates the current page on video change', () => {
    let video = videoMockFactory();
    video = {
      ...video,
      active_shared_live_media_page: 3,
      active_shared_live_media: {
        active_stamp: null,
        filename: null,
        is_ready_to_show: true,
        nb_pages: 6,
        show_download: false,
        title: null,
        upload_state: uploadState.DELETED,
        video: video.id,
        id: 'some_id',
        urls: { pages: { 3: 'my_thirdt_page.svg' } },
      },
    };

    render(<TeacherPIPControls video={video} maxPage={4} />);

    expect(mockSetSharedCurrentPage).toHaveBeenCalledWith({
      page: 3,
      imageUrl: 'my_thirdt_page.svg',
    });
  });
});

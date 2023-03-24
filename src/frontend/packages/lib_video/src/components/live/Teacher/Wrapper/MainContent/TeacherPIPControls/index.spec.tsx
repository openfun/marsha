import { screen } from '@testing-library/react';
import { useJwt, videoMockFactory, uploadState } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { TeacherPIPControls } from '.';

const mockCurrentPage = 1;
const mockSetSharedCurrentPage = jest.fn();
jest.mock('hooks/useSharedMediaCurrentPage', () => ({
  useSharedMediaCurrentPage: () => [mockCurrentPage, mockSetSharedCurrentPage],
}));

describe('<TeacherPIPControls />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'cool_token_m8',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders both buttons', () => {
    const video = videoMockFactory();

    render(wrapInVideo(<TeacherPIPControls maxPage={4} />, video));

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

    render(wrapInVideo(<TeacherPIPControls maxPage={4} />, video));

    expect(mockSetSharedCurrentPage).toHaveBeenCalledWith({
      page: 3,
      imageUrl: 'my_thirdt_page.svg',
    });
  });
});

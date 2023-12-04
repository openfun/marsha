import { screen } from '@testing-library/react';
import { uploadState, useJwt } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import {
  SharedMediaCurrentPageProvider,
  useSharedMediaCurrentPage,
} from '@lib-video/hooks/useSharedMediaCurrentPage';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { TeacherPIPControls } from '.';

const ComponentsTest = () => {
  const [shareMedia] = useSharedMediaCurrentPage();

  return (
    <div>
      <div>My page:{shareMedia.page}</div>
      <div>My image:{shareMedia.imageUrl}</div>
    </div>
  );
};

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
    video.active_shared_live_media_page = 5;

    render(
      wrapInVideo(
        <SharedMediaCurrentPageProvider
          value={{
            page: 1,
            imageUrl: 'https://example.com/sharedLiveMedia/1',
          }}
        >
          <TeacherPIPControls maxPage={4} />
          <ComponentsTest />
        </SharedMediaCurrentPageProvider>,
        video,
      ),
    );

    expect(
      screen.getByRole('button', { name: 'Next page' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeInTheDocument();
    expect(screen.getByText('My page:1')).toBeInTheDocument();
    expect(
      screen.getByText('My image:https://example.com/sharedLiveMedia/1'),
    ).toBeInTheDocument();
    expect(screen.queryByText('My page:5')).not.toBeInTheDocument();
  });

  it('updates the current page on video change', async () => {
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

    render(
      wrapInVideo(
        <SharedMediaCurrentPageProvider
          value={{
            page: 1,
            imageUrl: 'https://example.com/sharedLiveMedia/1',
          }}
        >
          <TeacherPIPControls maxPage={4} />
          <ComponentsTest />
        </SharedMediaCurrentPageProvider>,
        video,
      ),
    );

    expect(await screen.findByText('My page:3')).toBeInTheDocument();
    expect(screen.getByText('My image:my_thirdt_page.svg')).toBeInTheDocument();
  });
});

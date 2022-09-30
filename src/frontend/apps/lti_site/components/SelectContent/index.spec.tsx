import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Tab } from 'grommet';
import React, { Suspense } from 'react';

import { initiateLive } from 'data/sideEffects/initiateLive';
import { LiveModeType, liveState, uploadState } from 'types/tracks';
import {
  documentMockFactory,
  liveMockFactory,
  playlistMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import render from 'utils/tests/render';

import { SelectContent, SelectContentTabProps } from '.';

const mockAppData = {
  new_document_url: 'https://example.com/lti/documents/',
  new_video_url: 'https://example.com/lti/videos/',
  lti_select_form_action_url: '/lti/select/',
  lti_select_form_data: {},
  documents: undefined,
  videos: undefined,
};

jest.mock('data/stores/useAppConfig', () => ({
  useAppconfig: () => mockAppData,
}));

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  Loader: () => <span>Loader</span>,
}));

jest.mock('data/sideEffects/initiateLive', () => ({
  initiateLive: jest.fn(),
}));
const mockedInitiateLive = initiateLive as jest.MockedFunction<
  typeof initiateLive
>;

const mockCustomSelectContentTab = ({
  selectContent,
}: SelectContentTabProps) => (
  <Tab title="Custom app tab">
    <p
      onClick={() =>
        selectContent(
          'custom-select-content-url',
          'Custom select content title',
          'Custom select content description',
        )
      }
    >
      Select app content
    </p>
  </Tab>
);

jest.mock(
  'apps/custom_app/components/SelectContentTab',
  () => mockCustomSelectContentTab,
  {
    virtual: true,
  },
);

const mockOtherCustomSelectContentTab = ({
  selectContent,
}: SelectContentTabProps) => (
  <Tab title="Other custom app tab">
    <p
      onClick={() =>
        selectContent(
          'other-custom-select-content-url',
          'Other custom select content title',
          'Other custom select content description',
        )
      }
    >
      Other select app content
    </p>
  </Tab>
);

jest.mock(
  'apps/other_custom_app/components/SelectContentTab',
  () => mockOtherCustomSelectContentTab,
  {
    virtual: true,
  },
);

/**
 * Mock available app type in the front to provide the app used in the test
 */
jest.mock('types/AppData.ts', () => ({
  ...jest.requireActual('types/AppData.ts'),
  appNames: {
    custom_app: 'custom_app',
    other_custom_app: 'other_custom_app',
  },
}));

/**
 * Mock appConfig to override real config because enums are mock
 * and real values don't exist anymore
 */
jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({}),
}));

window.HTMLFormElement.prototype.submit = jest.fn();

describe('<SelectContent />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('displays content infos', async () => {
    render(
      <SelectContent
        playlist={playlistMockFactory({
          id: '1',
          title: 'Playlist 1',
        })}
        documents={[
          documentMockFactory({
            id: '1',
            title: 'Document 1',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
          }),
        ]}
        videos={[
          videoMockFactory({
            id: '1',
            title: 'Video 1',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
          }),
          videoMockFactory({
            id: '2',
            title: 'Video 2',
            upload_state: uploadState.READY,
            is_ready_to_show: true,
          }),
        ]}
        webinars={[
          liveMockFactory({
            id: '3',
            title: 'Webinar 1',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
            live_state: liveState.IDLE,
            live_type: LiveModeType.JITSI,
          }),
          liveMockFactory({
            id: '4',
            title: 'Webinar 2',
            upload_state: uploadState.READY,
            is_ready_to_show: true,
            live_state: liveState.IDLE,
            live_type: LiveModeType.JITSI,
          }),
        ]}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={mockAppData.lti_select_form_data!}
      />,
    );

    screen.getByText('Playlist Playlist 1 (1)');

    // Webinars tab
    const webinar1 = screen.getByTitle('Select Webinar 1');
    expect(webinar1.getElementsByTagName('img')[0]).toHaveAttribute(
      'src',
      'https://example.com/default_thumbnail/144',
    );

    expect(screen.queryByText('Webinar 1')).toBeNull();
    expect(screen.queryByText('Not uploaded')).toBeNull();
    expect(screen.queryByText('Not ready to show')).toBeNull();
    userEvent.hover(webinar1);
    screen.getByText('Webinar 1');
    screen.getByLabelText('Not uploaded');
    screen.getByLabelText('Not ready to show');
    userEvent.unhover(webinar1);

    expect(screen.queryByText('Webinar 2')).toBeNull();
    expect(screen.queryByText('Uploaded')).toBeNull();
    expect(screen.queryByText('Ready to show')).toBeNull();
    const webinar2 = screen.getByTitle('Select Webinar 2');
    userEvent.hover(webinar2);
    screen.getByText('Webinar 2');
    screen.getByLabelText('Uploaded');
    screen.getByLabelText('Ready to show');
    userEvent.unhover(webinar2);

    // Videos Tab
    const videoTab = screen.getByRole('tab', {
      name: /videos/i,
    });
    userEvent.click(videoTab);

    const video1 = screen.getByTitle('Select Video 1');
    expect(video1.getElementsByTagName('img')[0]).toHaveAttribute(
      'src',
      'https://example.com/default_thumbnail/144',
    );

    expect(screen.queryByText('Video 1')).toBeNull();
    expect(screen.queryByText('Not uploaded')).toBeNull();
    expect(screen.queryByText('Not ready to show')).toBeNull();
    userEvent.hover(video1);
    screen.getByText('Video 1');
    screen.getByLabelText('Not uploaded');
    screen.getByLabelText('Not ready to show');
    userEvent.unhover(video1);

    expect(screen.queryByText('Video 2')).toBeNull();
    expect(screen.queryByText('Uploaded')).toBeNull();
    expect(screen.queryByText('Ready to show')).toBeNull();
    userEvent.hover(screen.getByTitle('Select Video 2'));
    screen.getByText('Video 2');
    screen.getByLabelText('Uploaded');
    screen.getByLabelText('Ready to show');
    expect(screen.queryByText('Document 1')).toBeNull();
    expect(screen.queryByText('Not uploaded')).toBeNull();
    expect(screen.queryByText('Not ready to show')).toBeNull();

    // Documents Tab
    const documentTab = screen.getByRole('tab', {
      name: 'Documents',
    });
    userEvent.click(documentTab);
    userEvent.hover(screen.getByTitle('Select Document 1'));
    screen.getByText('Document 1');
    screen.getByLabelText('Not uploaded');
    screen.getByLabelText('Not ready to show');
  });

  it('displays first available generated video thumbnail', async () => {
    render(
      <SelectContent
        videos={[
          videoMockFactory({
            id: '1',
            title: 'Video 1',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
            urls: {
              manifests: {
                hls: '',
              },
              mp4: {},
              thumbnails: {
                480: 'https://example.com/default_thumbnail/480',
                720: 'https://example.com/default_thumbnail/720',
                1080: 'https://example.com/default_thumbnail/1080',
              },
            },
          }),
        ]}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={mockAppData.lti_select_form_data!}
      />,
    );
    userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    screen.getByTitle('Select Video 1');
    expect(
      screen.getByTitle('Select Video 1').getElementsByTagName('img')[0],
    ).toHaveAttribute('src', 'https://example.com/default_thumbnail/480');
  });

  it('displays first available uploaded video thumbnail', async () => {
    render(
      <SelectContent
        videos={[
          videoMockFactory({
            id: '1',
            title: 'Video 1',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
            thumbnail: {
              active_stamp: null,
              is_ready_to_show: true,
              upload_state: uploadState.READY,
              id: '1',
              video: '1',
              urls: {
                480: 'https://example.com/uploaded_thumbnail/480',
                720: 'https://example.com/uploaded_thumbnail/720',
                1080: 'https://example.com/uploaded_thumbnail/1080',
              },
            },
          }),
        ]}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={mockAppData.lti_select_form_data!}
      />,
    );

    userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    screen.getByTitle('Select Video 1');
    expect(
      screen.getByTitle('Select Video 1').getElementsByTagName('img')[0],
    ).toHaveAttribute('src', 'https://example.com/uploaded_thumbnail/480');
  });

  it('fallback to generated video thumbnail if uploaded thumbnail not ready', async () => {
    render(
      <SelectContent
        videos={[
          videoMockFactory({
            id: '1',
            title: 'Video 1',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
            thumbnail: {
              active_stamp: null,
              is_ready_to_show: false,
              upload_state: uploadState.PROCESSING,
              id: '1',
              video: '1',
              urls: {
                480: 'https://example.com/uploaded_thumbnail/480',
                720: 'https://example.com/uploaded_thumbnail/720',
                1080: 'https://example.com/uploaded_thumbnail/1080',
              },
            },
          }),
        ]}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={mockAppData.lti_select_form_data!}
      />,
    );

    userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    screen.getByTitle('Select Video 1');
    expect(
      screen.getByTitle('Select Video 1').getElementsByTagName('img')[0],
    ).toHaveAttribute('src', 'https://example.com/default_thumbnail/144');
  });

  it('video not uploaded', async () => {
    render(
      <SelectContent
        videos={[
          videoMockFactory({
            id: '1',
            title: 'Video 1',
            upload_state: uploadState.PENDING,
            is_ready_to_show: false,
            urls: null,
          }),
        ]}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={mockAppData.lti_select_form_data!}
      />,
    );

    userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    userEvent.hover(screen.getByTitle('Select Video 1'));
    screen.getByText('Video 1');
    screen.getByLabelText('Not uploaded');
    screen.getByLabelText('Not ready to show');
  });

  it('selects content', async () => {
    const { elementContainer: container } = render(
      <SelectContent
        documents={[
          documentMockFactory({
            id: '1',
            title: 'Document 1',
            description: 'Document 1 description',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
          }),
        ]}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
      />,
    );

    const documentTab = screen.getByRole('tab', {
      name: 'Documents',
    });
    userEvent.click(documentTab);
    userEvent.click(screen.getByTitle('Select Document 1'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container!.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti/documents/1',
            frame: [],
            title: 'Document 1',
            text: 'Document 1 description',
          },
        ],
      }),
    });
  });

  it('selects content with activity title and description', async () => {
    const { elementContainer: container } = render(
      <SelectContent
        documents={[
          documentMockFactory({
            id: '1',
            title: 'Document 1',
            description: 'Document 1 description',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
          }),
        ]}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
          activity_title: 'Activity title',
          activity_description: 'Activity description',
        }}
      />,
    );

    const documentTab = screen.getByRole('tab', {
      name: 'Documents',
    });
    userEvent.click(documentTab);
    userEvent.click(screen.getByTitle('Select Document 1'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container!.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti/documents/1',
            frame: [],
            title: 'Activity title',
            text: 'Activity description',
          },
        ],
      }),
    });
  });

  it('selects content with empty activity title and description', async () => {
    const { elementContainer: container } = render(
      <SelectContent
        documents={[
          documentMockFactory({
            id: '1',
            title: 'Document 1',
            description: 'Document 1 description',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
          }),
        ]}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
          activity_title: '',
          activity_description: '',
        }}
      />,
    );

    const documentTab = screen.getByRole('tab', {
      name: 'Documents',
    });
    userEvent.click(documentTab);
    userEvent.click(screen.getByTitle('Select Document 1'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container!.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti/documents/1',
            frame: [],
            title: 'Document 1',
            text: 'Document 1 description',
          },
        ],
      }),
    });
  });

  it('selects content without document title', async () => {
    const { elementContainer: container } = render(
      <SelectContent
        documents={[
          documentMockFactory({
            id: '1',
            title: null,
            description: 'Document 1 description',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
          }),
        ]}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
      />,
    );

    const documentTab = screen.getByRole('tab', {
      name: 'Documents',
    });
    userEvent.click(documentTab);
    userEvent.click(screen.getByTitle('Select'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container!.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti/documents/1',
            frame: [],
            text: 'Document 1 description',
          },
        ],
      }),
    });
  });

  it('adds new webinar', async () => {
    const playlist = playlistMockFactory();
    const video = videoMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/videos/', video);

    const { elementContainer: container } = render(
      <SelectContent
        playlist={playlist}
        documents={mockAppData.documents}
        videos={mockAppData.videos}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={mockAppData.lti_select_form_data!}
      />,
    );
    act(() => {
      userEvent.click(screen.getByText('Add a webinar'));
    });

    await waitFor(() => {
      expect(
        fetchMock.called('/api/videos/', {
          body: {
            playlist: playlist.id,
            live_type: LiveModeType.JITSI,
          },
          method: 'POST',
        }),
      ).toBe(true);

      expect(mockedInitiateLive).toHaveBeenCalledWith(
        video,
        LiveModeType.JITSI,
      );

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
    });

    const form = container!.querySelector('form');
    expect(form).toHaveFormValues({
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/videos/${video.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });

  it('adds new content', async () => {
    const playlist = playlistMockFactory();
    const video = videoMockFactory({
      title: null,
      description: null,
      upload_state: uploadState.INITIALIZED,
    });
    fetchMock.post('/api/videos/', video);

    const { elementContainer: container } = render(
      <SelectContent
        playlist={playlist}
        documents={mockAppData.documents}
        videos={mockAppData.videos}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={mockAppData.lti_select_form_data!}
      />,
    );
    userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    act(() => {
      userEvent.click(screen.getByText('Add a video'));
    });

    await waitFor(() => {
      expect(
        fetchMock.called('/api/videos/', {
          body: {
            playlist: playlist.id,
            upload_state: uploadState.INITIALIZED,
          },
          method: 'POST',
        }),
      ).toBe(true);

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
    });

    const form = container!.querySelector('form');
    expect(form).toHaveFormValues({
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/videos/${video.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });

  it('adds new content with activity title and description', async () => {
    const playlist = playlistMockFactory();
    const video = videoMockFactory({
      title: 'Activity title',
      description: 'Activity description',
      upload_state: uploadState.INITIALIZED,
    });

    fetchMock.post('/api/videos/', video);

    const { elementContainer: container } = render(
      <SelectContent
        playlist={playlist}
        documents={mockAppData.documents}
        videos={mockAppData.videos}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={{
          ...mockAppData.lti_select_form_data!,
          activity_title: 'Activity title',
          activity_description: 'Activity description',
        }}
      />,
    );
    userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    act(() => {
      userEvent.click(screen.getByText('Add a video'));
    });

    await waitFor(() => {
      expect(
        fetchMock.called('/api/videos/', {
          body: {
            playlist: playlist.id,
            title: 'Activity title',
            description: 'Activity description',
            upload_state: uploadState.INITIALIZED,
          },
          method: 'POST',
        }),
      ).toBe(true);

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
    });

    const form = container!.querySelector('form');
    expect(form).toHaveFormValues({
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/videos/${video.id}`,
            frame: [],
            title: 'Activity title',
            text: 'Activity description',
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });

  it('adds new content with empty activity title and description', async () => {
    const playlist = playlistMockFactory();
    const video = videoMockFactory({
      title: '',
      description: '',
      upload_state: uploadState.INITIALIZED,
    });

    fetchMock.post('/api/videos/', video);

    const { elementContainer: container } = render(
      <SelectContent
        playlist={playlist}
        documents={mockAppData.documents}
        videos={mockAppData.videos}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
        lti_select_form_data={{
          ...mockAppData.lti_select_form_data!,
          activity_title: '',
          activity_description: '',
        }}
      />,
    );
    userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    act(() => {
      userEvent.click(screen.getByText('Add a video'));
    });

    await waitFor(() => {
      expect(
        fetchMock.called('/api/videos/', {
          body: {
            playlist: playlist.id,
            title: '',
            description: '',
            upload_state: uploadState.INITIALIZED,
          },
          method: 'POST',
        }),
      ).toBe(true);

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
    });

    const form = container!.querySelector('form');
    expect(form).toHaveFormValues({
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/videos/${video.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });

  it('loads app tab', async () => {
    const { elementContainer: container } = render(
      <Suspense fallback="Loading...">
        <SelectContent
          lti_select_form_action_url={mockAppData.lti_select_form_action_url!}
          lti_select_form_data={{
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
          }}
        />
      </Suspense>,
    );

    const otherCustomAppTab = await screen.findByRole('tab', {
      name: 'Other custom app tab',
    });
    userEvent.click(otherCustomAppTab);
    screen.getByText('Other select app content');
    expect(screen.queryByText('Select app content')).not.toBeInTheDocument();

    const customAppTab = await screen.findByRole('tab', {
      name: 'Custom app tab',
    });
    userEvent.click(customAppTab);
    expect(
      screen.queryByText('Other select app content'),
    ).not.toBeInTheDocument();
    userEvent.click(screen.getByText('Select app content'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container!.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'custom-select-content-url',
            frame: [],
            title: 'Custom select content title',
            text: 'Custom select content description',
          },
        ],
      }),
    });
  });
});

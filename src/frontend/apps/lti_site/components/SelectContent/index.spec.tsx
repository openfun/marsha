import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Tab } from 'grommet';
import {
  LiveModeType,
  liveState,
  selectableBaseResource,
  uploadState,
} from 'lib-components';
import {
  documentMockFactory,
  liveMockFactory,
  playlistMockFactory,
  videoMockFactory,
} from 'lib-components/tests';
import { render } from 'lib-tests';
import { initiateLive } from 'lib-video';
import React from 'react';

import { SelectContentTabProps } from './SelectContentTabs';
import { buildContentItems } from './utils';

import { SelectContent } from '.';

jest.mock(
  'data/hooks/useIsFeatureEnabled',
  () =>
    ({
      useIsFeatureEnabled: () => () => true,
    }) as any,
);

const mockAppData = {
  new_document_url: 'https://example.com/lti/documents/',
  new_video_url: 'https://example.com/lti/videos/',
  lti_select_form_action_url: '/lti/select/',
  lti_select_form_data: {},
  documents: undefined,
  videos: undefined,
};

/**
 * - Mock available app type in the front to provide the app used in the test
 * - Mock appConfig to override real config because enums are mock
 * and real values don't exist anymore
 */
jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppconfig: () => mockAppData,
  Loader: () => <span>Loader</span>,
  useAppConfig: () => ({}),
  appNames: {
    custom_app: 'custom_app',
    other_custom_app: 'other_custom_app',
  },
}));

jest.mock('lib-video', () => ({
  ...jest.requireActual('lib-video'),
  initiateLive: jest.fn(),
}));
const mockedInitiateLive = initiateLive as jest.MockedFunction<
  typeof initiateLive
>;

const mockCustomSelectContentTab = ({
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentTabProps) => (
  <Tab title="Custom app tab">
    <p
      onClick={() =>
        buildContentItems(
          'custom-select-content-url',
          'Custom select content title',
          'Custom select content description',
          lti_select_form_data,
          setContentItemsValue,
        )
      }
    >
      Select app content
    </p>
  </Tab>
);

jest.mock(
  'apps/custom_app/components/SelectContent/SelectContentTab',
  () => mockCustomSelectContentTab,
  {
    virtual: true,
  },
);

const mockOtherCustomSelectContentTab = ({
  lti_select_form_data,
  setContentItemsValue,
}: SelectContentTabProps) => (
  <Tab title="Other custom app tab">
    <p
      onClick={() =>
        buildContentItems(
          'other-custom-select-content-url',
          'Other custom select content title',
          'Other custom select content description',
          lti_select_form_data,
          setContentItemsValue,
        )
      }
    >
      Other select app content
    </p>
  </Tab>
);

jest.mock(
  'apps/other_custom_app/components/SelectContent/SelectContentTab',
  () => mockOtherCustomSelectContentTab,
  {
    virtual: true,
  },
);

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
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
        lti_select_form_data={mockAppData.lti_select_form_data}
      />,
    );

    // Webinars tab
    expect(
      within(screen.getByLabelText('Select Webinar 1')).getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle({
      background:
        'url(https://example.com/default_thumbnail/144) no-repeat center / cover',
    });

    // Videos Tab
    const videoTab = screen.getByRole('tab', {
      name: 'Videos',
    });
    await userEvent.click(videoTab);

    expect(
      within(screen.getByLabelText('Select Video 1')).getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle({
      background:
        'url(https://example.com/default_thumbnail/144) no-repeat center / cover',
    });

    // Documents Tab
    const documentTab = screen.getByRole('tab', {
      name: 'Documents',
    });
    await userEvent.click(documentTab);
    screen.getByText('Document 1');
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
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
        lti_select_form_data={mockAppData.lti_select_form_data}
      />,
    );
    await userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    expect(
      within(screen.getByLabelText('Select Video 1')).getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle({
      background:
        'url(https://example.com/default_thumbnail/480) no-repeat center / cover',
    });
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
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
        lti_select_form_data={mockAppData.lti_select_form_data}
      />,
    );

    await userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    expect(
      within(screen.getByLabelText('Select Video 1')).getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle({
      background:
        'url(https://example.com/uploaded_thumbnail/480) no-repeat center / cover',
    });
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
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
        lti_select_form_data={mockAppData.lti_select_form_data}
      />,
    );

    await userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    expect(
      within(screen.getByLabelText('Select Video 1')).getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle({
      background:
        'url(https://example.com/default_thumbnail/144) no-repeat center / cover',
    });
  });

  it('selects content', async () => {
    render(
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
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
      />,
    );

    const documentTab = screen.getByRole('tab', {
      name: 'Documents',
    });
    await userEvent.click(documentTab);
    await userEvent.click(screen.getByLabelText('Select Document 1'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('form')).toHaveFormValues({
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
    render(
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
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
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
    await userEvent.click(documentTab);
    await userEvent.click(screen.getByLabelText('Select Document 1'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('form')).toHaveFormValues({
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
    render(
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
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
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
    await userEvent.click(documentTab);
    await userEvent.click(screen.getByLabelText('Select Document 1'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('form')).toHaveFormValues({
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
    render(
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
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
      />,
    );

    const documentTab = screen.getByRole('tab', {
      name: 'Documents',
    });
    await userEvent.click(documentTab);
    await userEvent.click(screen.getByLabelText('Select'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('form')).toHaveFormValues({
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

    render(
      <SelectContent
        playlist={playlist}
        documents={mockAppData.documents}
        videos={mockAppData.videos}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
        lti_select_form_data={mockAppData.lti_select_form_data}
      />,
    );
    await userEvent.click(screen.getByText('Add a webinar'));

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
    });

    expect(mockedInitiateLive).toHaveBeenCalledWith(video, LiveModeType.JITSI);

    await waitFor(() => {
      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
    });

    const form = screen.getByRole('form');
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

    render(
      <SelectContent
        playlist={playlist}
        documents={mockAppData.documents}
        videos={mockAppData.videos}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
        lti_select_form_data={mockAppData.lti_select_form_data}
      />,
    );
    await userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    await userEvent.click(screen.getByText('Add a video'));

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
    });
    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    const form = screen.getByRole('form');
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

    render(
      <SelectContent
        playlist={playlist}
        documents={mockAppData.documents}
        videos={mockAppData.videos}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
        lti_select_form_data={{
          ...mockAppData.lti_select_form_data,
          activity_title: 'Activity title',
          activity_description: 'Activity description',
        }}
      />,
    );
    await userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    await userEvent.click(screen.getByText('Add a video'));

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
    });
    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    const form = screen.getByRole('form');
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

    render(
      <SelectContent
        playlist={playlist}
        documents={mockAppData.documents}
        videos={mockAppData.videos}
        new_document_url={mockAppData.new_document_url}
        new_video_url={mockAppData.new_video_url}
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
        lti_select_form_data={{
          ...mockAppData.lti_select_form_data,
          activity_title: '',
          activity_description: '',
        }}
      />,
    );
    await userEvent.click(screen.getByRole('tab', { name: /videos/i }));
    await userEvent.click(screen.getByText('Add a video'));

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
    });
    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    const form = screen.getByRole('form');
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

  it('renders the SelectContentTargetedResource', () => {
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
        lti_select_form_action_url={mockAppData.lti_select_form_action_url}
        lti_select_form_data={mockAppData.lti_select_form_data}
        targeted_resource={selectableBaseResource.VIDEO}
        playlist={playlistMockFactory()}
      />,
    );

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    screen.getByRole('heading', { name: 'Videos' });
  });
});

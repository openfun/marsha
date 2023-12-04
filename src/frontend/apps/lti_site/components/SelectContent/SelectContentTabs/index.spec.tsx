import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tab } from 'grommet';
import { LiveModeType, liveState, uploadState } from 'lib-components';
import {
  documentMockFactory,
  liveMockFactory,
  playlistMockFactory,
  videoMockFactory,
} from 'lib-components/tests';
import { render } from 'lib-tests';
import React, { Suspense } from 'react';

import { useIsFeatureEnabled } from 'data/hooks/useIsFeatureEnabled';

import { buildContentItems } from '../utils';

import { SelectContentTabProps, SelectContentTabs } from '.';

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
  appNames: {
    custom_app: 'custom_app',
    other_custom_app: 'other_custom_app',
  },
  useAppConfig: () => ({}),
}));

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

const mockSetContentItemsValue = jest.fn();

jest.mock(
  'data/hooks/useIsFeatureEnabled',
  () =>
    ({
      useIsFeatureEnabled: jest.fn(),
    }) as any,
);

const mockUseIsFeatureEnabled = useIsFeatureEnabled as jest.MockedFunction<
  typeof useIsFeatureEnabled
>;

describe('SelectContentTabs', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders all tabs', async () => {
    mockUseIsFeatureEnabled.mockImplementation(() => {
      return (flag) => {
        const activeResources = ['webinar', 'video', 'document', 'custom_app'];
        return activeResources.includes(flag);
      };
    });
    render(
      <Suspense fallback="Loading...">
        <SelectContentTabs
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
          lti_select_form_data={{
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
          }}
          setContentItemsValue={mockSetContentItemsValue}
        />
      </Suspense>,
    );

    expect(screen.getByRole('tab', { name: 'Webinars' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Videos' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Documents' })).toBeInTheDocument();
    expect(
      await screen.findByRole('tab', { name: 'Other custom app tab' }),
    ).toBeInTheDocument();

    // Webinars tab
    expect(
      within(screen.getByLabelText('Select Webinar 1')).getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle({
      background:
        'url(https://example.com/default_thumbnail/144) no-repeat center / cover',
    });

    screen.getByText('Webinar 1');
    screen.getByText('Webinar 2');

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

    screen.getByText('Video 1');
    screen.getByText('Video 2');
    expect(screen.queryByText('Document 1')).toBeNull();

    // Documents Tab
    const documentTab = screen.getByRole('tab', {
      name: 'Documents',
    });
    await userEvent.click(documentTab);
    screen.getByText('Document 1');

    const otherCustomAppTab = await screen.findByRole('tab', {
      name: 'Other custom app tab',
    });
    await userEvent.click(otherCustomAppTab);
    await screen.findByText('Other select app content');
    expect(screen.queryByText('Select app content')).not.toBeInTheDocument();

    const customAppTab = await screen.findByRole('tab', {
      name: 'Custom app tab',
    });

    await userEvent.click(customAppTab);

    expect(
      screen.queryByText('Other select app content'),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Select app content'));

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
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
    );
  });

  it('renders only active tabs', () => {
    mockUseIsFeatureEnabled.mockImplementation(() => {
      return (flag) => {
        const activeResources = ['video'];
        return activeResources.includes(flag);
      };
    });
    render(
      <Suspense fallback="Loading...">
        <SelectContentTabs
          playlist={playlistMockFactory({
            id: '1',
            title: 'Playlist 1',
          })}
          lti_select_form_data={{
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
          }}
          setContentItemsValue={mockSetContentItemsValue}
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
        />
      </Suspense>,
    );

    expect(
      screen.queryByRole('tab', { name: 'Webinars' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Videos' })).toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: 'Documents' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: 'Other custom app tab' }),
    ).not.toBeInTheDocument();

    // First tab is active
    screen.getByText('Video 1');
    screen.getByText('Video 2');
  });
});

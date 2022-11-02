import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tab } from 'grommet';
import React, { Suspense } from 'react';

import {
  LiveModeType,
  liveState,
  uploadState,
  documentMockFactory,
  liveMockFactory,
  playlistMockFactory,
  videoMockFactory,
} from 'lib-components';
import render from 'utils/tests/render';

import { buildContentItems } from '../utils';
import { SelectContentTabs, SelectContentTabProps } from '.';

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

describe('SelectContentTabs', () => {
  it('renders all tabs', async () => {
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
      name: 'Videos',
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
});

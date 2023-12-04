import { screen, within } from '@testing-library/react';
import {
  LiveModeType,
  appNames,
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
import React from 'react';

import { SelectContentTargetedResource } from '.';

const mockSetContentItemsValue = jest.fn();

/**
 * Mock available app type in the front to provide the app used in the test
 */
jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  appNames: {
    custom_app: 'custom_app',
  },
}));

const mockSelectContentResource = () => {
  return <div>custom app</div>;
};

jest.mock(
  'apps/custom_app/components/SelectContent/SelectContentResource',
  () => mockSelectContentResource,
  {
    virtual: true,
  },
);

describe('SelectContentTargetedResource', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the video targeted resource', () => {
    render(
      <SelectContentTargetedResource
        targeted_resource={selectableBaseResource.VIDEO}
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
        new_video_url="https://example.com/lti/videos/"
        setContentItemsValue={mockSetContentItemsValue}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        playlist={playlistMockFactory()}
      />,
    );

    screen.getByRole('heading', { name: 'Videos' });

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
  });

  it('renders the document targeted resource', () => {
    render(
      <SelectContentTargetedResource
        targeted_resource={selectableBaseResource.DOCUMENT}
        documents={[
          documentMockFactory({
            id: '1',
            title: 'Document 1',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
          }),
        ]}
        new_document_url="https://example.com/lti/documents/"
        setContentItemsValue={mockSetContentItemsValue}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        playlist={playlistMockFactory()}
      />,
    );

    screen.getByRole('heading', { name: 'Documents' });

    screen.getByLabelText('Select Document 1');
    expect(screen.getByText('Document 1')).toBeInTheDocument();
  });

  it('renders the webinar targeted resource', () => {
    render(
      <SelectContentTargetedResource
        targeted_resource={selectableBaseResource.WEBINAR}
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
        new_video_url="https://example.com/lti/videos/"
        setContentItemsValue={mockSetContentItemsValue}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        playlist={playlistMockFactory()}
      />,
    );

    screen.getByRole('heading', { name: 'Webinars' });

    expect(
      within(screen.getByLabelText('Select Webinar 1')).getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle({
      background:
        'url(https://example.com/default_thumbnail/144) no-repeat center / cover',
    });
  });

  it('renders a dynamic resource loaded from an app', async () => {
    render(
      <SelectContentTargetedResource
        targeted_resource={'custom_app' as appNames}
        setContentItemsValue={mockSetContentItemsValue}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        playlist={playlistMockFactory()}
      />,
    );

    expect(await screen.findByText('custom app')).toBeInTheDocument();
  });
});

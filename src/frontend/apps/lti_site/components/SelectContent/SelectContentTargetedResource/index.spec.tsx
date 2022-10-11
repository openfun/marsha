import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { appNames, selectableBaseResource } from 'types/AppData';
import { LiveModeType, liveState, uploadState } from 'types/tracks';
import {
  documentMockFactory,
  liveMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';

import render from 'utils/tests/render';

import { SelectContentTargetedResource } from '.';

const mockSetContentItemsValue = jest.fn();

/**
 * Mock available app type in the front to provide the app used in the test
 */
jest.mock('types/AppData.ts', () => ({
  ...jest.requireActual('types/AppData.ts'),
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
      />,
    );

    screen.getByRole('heading', { name: 'Videos' });

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
      />,
    );

    screen.getByRole('heading', { name: 'Documents' });

    userEvent.hover(screen.getByTitle('Select Document 1'));
    screen.getByText('Document 1');
    screen.getByLabelText('Not uploaded');
    screen.getByLabelText('Not ready to show');
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
      />,
    );

    screen.getByRole('heading', { name: 'Webinars' });

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
      />,
    );

    await screen.findByText('custom app');
  });
});

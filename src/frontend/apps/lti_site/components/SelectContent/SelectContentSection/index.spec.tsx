import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { uploadState } from 'lib-components';
import { documentMockFactory, videoMockFactory } from 'lib-components';
import render from 'utils/tests/render';

import { SelectContentSection } from '.';

const mockAddAndSelectContent = jest.fn();
const mockSetContentItemsValue = jest.fn();

describe('SelectContentSection', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('displays videos, select one and create a new one', () => {
    render(
      <SelectContentSection
        addMessage="new video"
        addAndSelectContent={mockAddAndSelectContent}
        items={[
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
        newLtiUrl="https://example.com/lti/videos/"
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

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

    const newVideo = screen.getByText('new video');
    userEvent.click(newVideo);
    expect(mockAddAndSelectContent).toHaveBeenCalledTimes(1);

    userEvent.click(video1);
    expect(mockSetContentItemsValue).toHaveBeenCalledTimes(1);
  });

  it('displays documents, select one and create a new one', () => {
    render(
      <SelectContentSection
        addMessage="new document"
        addAndSelectContent={mockAddAndSelectContent}
        items={[
          documentMockFactory({
            id: '1',
            title: 'Document 1',
            upload_state: uploadState.PROCESSING,
            is_ready_to_show: false,
          }),
        ]}
        newLtiUrl="https://example.com/lti/documents/"
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    const document1 = screen.getByTitle('Select Document 1');

    userEvent.hover(screen.getByTitle('Select Document 1'));
    screen.getByText('Document 1');
    screen.getByLabelText('Not uploaded');
    screen.getByLabelText('Not ready to show');

    userEvent.click(document1);
    expect(mockSetContentItemsValue).toHaveBeenCalledTimes(1);

    const newDocument = screen.getByText('new document');
    userEvent.click(newDocument);
    expect(mockAddAndSelectContent).toHaveBeenCalledTimes(1);
  });
});

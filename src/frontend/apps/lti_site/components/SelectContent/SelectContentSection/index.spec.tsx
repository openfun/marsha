import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  documentMockFactory,
  liveMockFactory,
  videoMockFactory,
} from 'lib-components/tests';
import { render } from 'lib-tests';

import { SelectContentSection } from '.';

const mockAddAndSelectContent = jest.fn();
const mockSetContentItemsValue = jest.fn();

describe('SelectContentSection', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('displays videos, select one and create a new one', async () => {
    render(
      <SelectContentSection
        addMessage="new video"
        addAndSelectContent={mockAddAndSelectContent}
        items={[
          videoMockFactory({
            title: 'Video 1',
          }),
          videoMockFactory({
            title: 'Video 2',
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

    const video1 = screen.getByLabelText('Select Video 1');
    expect(
      within(video1).getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle(
      `background: url(https://example.com/default_thumbnail/240) no-repeat center / cover`,
    );

    const newVideo = screen.getByText('new video');
    await userEvent.click(newVideo);
    expect(mockAddAndSelectContent).toHaveBeenCalledTimes(1);

    await userEvent.click(video1);
    expect(mockSetContentItemsValue).toHaveBeenCalledTimes(1);
  });

  it('displays webinars, select one and create a new one', async () => {
    render(
      <SelectContentSection
        addMessage="new webinar"
        addAndSelectContent={mockAddAndSelectContent}
        items={[
          liveMockFactory({
            title: 'Webinar 1',
          }),
          liveMockFactory({
            title: 'Webinar 2',
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

    const webinar1 = screen.getByLabelText('Select Webinar 1');
    expect(
      within(webinar1).getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle(
      `background: url(https://example.com/default_thumbnail/240) no-repeat center / cover`,
    );

    const newWebinar = screen.getByText('new webinar');
    await userEvent.click(newWebinar);
    expect(mockAddAndSelectContent).toHaveBeenCalledTimes(1);

    await userEvent.click(webinar1);
    expect(mockSetContentItemsValue).toHaveBeenCalledTimes(1);
  });

  it('displays documents, select one and create a new one', async () => {
    render(
      <SelectContentSection
        addMessage="new document"
        addAndSelectContent={mockAddAndSelectContent}
        items={[
          documentMockFactory({
            title: 'Document 1',
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

    const document1 = screen.getByLabelText('Select Document 1');

    await userEvent.hover(screen.getByLabelText('Select Document 1'));

    await userEvent.click(document1);
    expect(mockSetContentItemsValue).toHaveBeenCalledTimes(1);

    const newDocument = screen.getByText('new document');
    await userEvent.click(newDocument);
    expect(mockAddAndSelectContent).toHaveBeenCalledTimes(1);
  });
});

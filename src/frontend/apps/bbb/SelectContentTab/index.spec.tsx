import { fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { SelectContent } from 'components/SelectContent';
import { appData } from 'data/appData';
import { playlistMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { meetingMockFactory } from 'apps/bbb/utils/tests/factories';

jest.mock('settings', () => ({
  APPS: ['bbb'],
}));

jest.mock('data/appData', () => ({
  appData: {
    new_document_url: 'https://example.com/lti/documents/new-hash',
    new_video_url: 'https://example.com/lti/videos/new-hash',
    lti_select_form_action_url: '/lti/select/',
    lti_select_form_data: {},
    flags: {
      BBB: true,
    },
  },
}));

window.HTMLFormElement.prototype.submit = jest.fn();

const currentPlaylist = playlistMockFactory();

const meeting = meetingMockFactory({
  title: 'meeting 1',
  playlist: currentPlaylist,
});
const selectMeetingResponse = {
  new_url: 'https://example.com/meetings/new_uuid/',
  meetings: [meeting],
};

fetchMock.get('/api/meetings/lti-select/', selectMeetingResponse);

describe('<SelectContent />', () => {
  afterEach(jest.resetAllMocks);

  it('select content', async () => {
    const queryClient = new QueryClient();

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={{
                lti_response_url: 'https://example.com/lti',
                lti_message_type: 'ContentItemSelection',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const meetingTab = await screen.findByRole('tab', {
      name: 'Meetings',
    });
    fireEvent.click(meetingTab);
    fireEvent.click(screen.getByTitle(`Select ${meeting.title}`));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: meeting.lti_url,
            title: meeting.title,
            frame: [],
          },
        ],
      }),
    });
  });

  it('add new content', async () => {
    const queryClient = new QueryClient();

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={{
                lti_response_url: 'https://example.com/lti',
                lti_message_type: 'ContentItemSelection',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const meetingTab = await screen.findByRole('tab', {
      name: 'Meetings',
    });
    fireEvent.click(meetingTab);
    fireEvent.click(screen.getByText('Add a meeting'));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    const form = container.querySelector('form');
    expect(form).toHaveFormValues({
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/meetings/new_uuid/',
            title: 'New meeting',
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });
});

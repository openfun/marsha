import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      markdown: false,
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
  new_url: 'https://example.com/lti/meetings/',
  meetings: [meeting],
};

fetchMock.get('/api/meetings/lti-select/', selectMeetingResponse);

describe('<SelectContent />', () => {
  afterEach(jest.resetAllMocks);

  it('selects content', async () => {
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
    userEvent.click(meetingTab);
    userEvent.click(screen.getByTitle(`Select ${meeting.title}`));

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
            frame: [],
            title: meeting.title,
            text: meeting.description,
          },
        ],
      }),
    });
  });

  it('selects content with activity title and description', async () => {
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
                activity_title: 'Activity title',
                activity_description: 'Activity description',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const meetingTab = await screen.findByRole('tab', {
      name: 'Meetings',
    });
    userEvent.click(meetingTab);
    userEvent.click(screen.getByTitle(`Select ${meeting.title}`));

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
            frame: [],
            title: 'Activity title',
            text: 'Activity description',
          },
        ],
      }),
    });
  });

  it('selects content with empty activity title and description', async () => {
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
                activity_title: '',
                activity_description: '',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const meetingTab = await screen.findByRole('tab', {
      name: 'Meetings',
    });
    userEvent.click(meetingTab);
    userEvent.click(screen.getByTitle(`Select ${meeting.title}`));

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
            frame: [],
            title: meeting.title,
            text: meeting.description,
          },
        ],
      }),
    });
  });

  it('adds new content', async () => {
    const queryClient = new QueryClient();
    const playlist = playlistMockFactory();
    const newMeeting = meetingMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/meetings/', newMeeting);

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              playlist={playlist}
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
    userEvent.click(meetingTab);
    userEvent.click(screen.getByText('Add a meeting'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/meetings/', {
          body: {
            playlist: playlist.id,
          },
          method: 'POST',
        }),
      ).toBe(true);

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
    });

    const form = container.querySelector('form');
    expect(form).toHaveFormValues({
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/meetings/${newMeeting.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });

  it('adds new content with activity title and description', async () => {
    const queryClient = new QueryClient();
    const playlist = playlistMockFactory();
    const newMeeting = meetingMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/meetings/', newMeeting, {
      overwriteRoutes: true,
    });

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              playlist={playlist}
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={{
                lti_response_url: 'https://example.com/lti',
                lti_message_type: 'ContentItemSelection',
                activity_title: 'Activity title',
                activity_description: 'Activity description',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const meetingTab = await screen.findByRole('tab', {
      name: 'Meetings',
    });
    userEvent.click(meetingTab);
    userEvent.click(screen.getByText('Add a meeting'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/meetings/', {
          body: {
            playlist: playlist.id,
            title: 'Activity title',
            description: 'Activity description',
          },
          method: 'POST',
        }),
      ).toBe(true);

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
    });

    const form = container.querySelector('form');
    expect(form).toHaveFormValues({
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/meetings/${newMeeting.id}`,
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
    const queryClient = new QueryClient();
    const playlist = playlistMockFactory();
    const newMeeting = meetingMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/meetings/', newMeeting, {
      overwriteRoutes: true,
    });

    const { container } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent
              playlist={playlist}
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={{
                lti_response_url: 'https://example.com/lti',
                lti_message_type: 'ContentItemSelection',
                activity_title: '',
                activity_description: '',
              }}
            />
          </Suspense>
        </QueryClientProvider>,
      ),
    );

    const meetingTab = await screen.findByRole('tab', {
      name: 'Meetings',
    });
    userEvent.click(meetingTab);
    userEvent.click(screen.getByText('Add a meeting'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/meetings/', {
          body: {
            playlist: playlist.id,
            title: '',
            description: '',
          },
          method: 'POST',
        }),
      ).toBe(true);

      expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
    });

    const form = container.querySelector('form');
    expect(form).toHaveFormValues({
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/meetings/${newMeeting.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });
});

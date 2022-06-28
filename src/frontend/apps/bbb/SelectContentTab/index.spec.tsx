import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { SelectContent } from 'components/SelectContent';
import { appData } from 'data/appData';
import { playlistMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { classroomMockFactory } from 'apps/bbb/utils/tests/factories';

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

const classroom = classroomMockFactory({
  title: 'classroom 1',
  playlist: currentPlaylist,
});
const selectClassroomResponse = {
  new_url: 'https://example.com/lti/classrooms/',
  classrooms: [classroom],
};

fetchMock.get('/api/classrooms/lti-select/', selectClassroomResponse);

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

    const classroomTab = await screen.findByRole('tab', {
      name: 'Classrooms',
    });
    userEvent.click(classroomTab);
    userEvent.click(screen.getByTitle(`Select ${classroom.title}`));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: classroom.lti_url,
            frame: [],
            title: classroom.title,
            text: classroom.description,
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

    const classroomTab = await screen.findByRole('tab', {
      name: 'Classrooms',
    });
    userEvent.click(classroomTab);
    userEvent.click(screen.getByTitle(`Select ${classroom.title}`));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: classroom.lti_url,
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

    const classroomTab = await screen.findByRole('tab', {
      name: 'Classrooms',
    });
    userEvent.click(classroomTab);
    userEvent.click(screen.getByTitle(`Select ${classroom.title}`));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: classroom.lti_url,
            frame: [],
            title: classroom.title,
            text: classroom.description,
          },
        ],
      }),
    });
  });

  it('adds new content', async () => {
    const queryClient = new QueryClient();
    const playlist = playlistMockFactory();
    const newClassroom = classroomMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/classrooms/', newClassroom);

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

    const classroomTab = await screen.findByRole('tab', {
      name: 'Classrooms',
    });
    userEvent.click(classroomTab);
    userEvent.click(screen.getByText('Add a classroom'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/classrooms/', {
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
            url: `https://example.com/lti/classrooms/${newClassroom.id}`,
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
    const newClassroom = classroomMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/classrooms/', newClassroom, {
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

    const classroomTab = await screen.findByRole('tab', {
      name: 'Classrooms',
    });
    userEvent.click(classroomTab);
    userEvent.click(screen.getByText('Add a classroom'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/classrooms/', {
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
            url: `https://example.com/lti/classrooms/${newClassroom.id}`,
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
    const newClassroom = classroomMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/classrooms/', newClassroom, {
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

    const classroomTab = await screen.findByRole('tab', {
      name: 'Classrooms',
    });
    userEvent.click(classroomTab);
    userEvent.click(screen.getByText('Add a classroom'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/classrooms/', {
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
            url: `https://example.com/lti/classrooms/${newClassroom.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });
});

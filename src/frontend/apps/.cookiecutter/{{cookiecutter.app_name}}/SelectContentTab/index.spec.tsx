import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React, { Suspense } from 'react';

import { SelectContent } from 'components/SelectContent';
import { appData } from 'data/appData';
import { playlistMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import {{'{'}} {{cookiecutter.model_lower}}MockFactory } from 'apps/{{cookiecutter.app_name}}/utils/tests/factories';

jest.mock('settings', () => ({
  APPS: ['{{cookiecutter.app_name}}'],
}));

jest.mock('data/appData', () => ({
  appData: {
    new_document_url: 'https://example.com/lti/documents/new-hash',
    new_video_url: 'https://example.com/lti/videos/new-hash',
    lti_select_form_action_url: '/lti/select/',
    lti_select_form_data: {},
    flags: {
      {{cookiecutter.app_name}}: true,
      markdown: false,
    },
  },
}));

window.HTMLFormElement.prototype.submit = jest.fn();

const currentPlaylist = playlistMockFactory();

const {{cookiecutter.model_lower}} = {{cookiecutter.model_lower}}MockFactory({
  title: '{{cookiecutter.model_lower}} 1',
  playlist: currentPlaylist,
});
const select{{cookiecutter.model}}Response = {
  new_url: 'https://example.com/lti/{{cookiecutter.model_plural_lower}}/',
  {{cookiecutter.model_plural_lower}}: [{{cookiecutter.model_lower}}],
};

fetchMock.get('/api/{{cookiecutter.model_url_part}}/lti-select/', select{{cookiecutter.model}}Response);

describe('<SelectContent />', () => {
  afterEach(jest.resetAllMocks);

  it('selects content', async () => {
    const { container } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <SelectContent
          lti_select_form_action_url={appData.lti_select_form_action_url!}
          lti_select_form_data={{'{{'}}
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
          {{'}}'}}
        />
      </Suspense>,
    );

    const {{cookiecutter.model_lower}}Tab = await screen.findByRole('tab', {
      name: '{{cookiecutter.model_plural}}',
    });
    userEvent.click({{cookiecutter.model_lower}}Tab);
    userEvent.click(screen.getByTitle(`Select ${{'{'}}{{cookiecutter.model_lower}}.title}`));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: {{cookiecutter.model_lower}}.lti_url,
            frame: [],
            title: {{cookiecutter.model_lower}}.title,
            text: {{cookiecutter.model_lower}}.description,
          },
        ],
      }),
    });
  });

  it('selects content with activity title and description', async () => {
    const { container } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <SelectContent
          lti_select_form_action_url={appData.lti_select_form_action_url!}
          lti_select_form_data={{'{{'}}
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
            activity_title: 'Activity title',
            activity_description: 'Activity description',
          {{'}}'}}
        />
      </Suspense>,
    );

    const {{cookiecutter.model_lower}}Tab = await screen.findByRole('tab', {
      name: '{{cookiecutter.model_plural}}',
    });
    userEvent.click({{cookiecutter.model_lower}}Tab);
    userEvent.click(screen.getByTitle(`Select ${{'{'}}{{cookiecutter.model_lower}}.title}`));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: {{cookiecutter.model_lower}}.lti_url,
            frame: [],
            title: 'Activity title',
            text: 'Activity description',
          },
        ],
      }),
    });
  });

  it('selects content with empty activity title and description', async () => {
    const { container } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <SelectContent
          lti_select_form_action_url={appData.lti_select_form_action_url!}
          lti_select_form_data={{'{{'}}
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
            activity_title: '',
            activity_description: '',
          {{'}}'}}
        />
      </Suspense>,
    );

    const {{cookiecutter.model_lower}}Tab = await screen.findByRole('tab', {
      name: '{{cookiecutter.model_plural}}',
    });
    userEvent.click({{cookiecutter.model_lower}}Tab);
    userEvent.click(screen.getByTitle(`Select ${{'{'}}{{cookiecutter.model_lower}}.title}`));

    expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);

    expect(container.querySelector('form')).toHaveFormValues({
      lti_response_url: 'https://example.com/lti',
      lti_message_type: 'ContentItemSelection',
      content_items: JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: {{cookiecutter.model_lower}}.lti_url,
            frame: [],
            title: {{cookiecutter.model_lower}}.title,
            text: {{cookiecutter.model_lower}}.description,
          },
        ],
      }),
    });
  });

  it('adds new content', async () => {
    const playlist = playlistMockFactory();
    const new{{cookiecutter.model}} = {{cookiecutter.model_lower}}MockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/{{cookiecutter.model_url_part}}/', new{{cookiecutter.model}});

    const { container } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <SelectContent
          playlist={playlist}
          lti_select_form_action_url={appData.lti_select_form_action_url!}
          lti_select_form_data={{'{{'}}
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
          {{'}}'}}
        />
      </Suspense>,
    );

    const {{cookiecutter.model_lower}}Tab = await screen.findByRole('tab', {
      name: '{{cookiecutter.model_plural}}',
    });
    userEvent.click({{cookiecutter.model_lower}}Tab);
    userEvent.click(screen.getByText('Add a {{cookiecutter.model_lower}}'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/{{cookiecutter.model_url_part}}/', {
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
            url: `https://example.com/lti/{{cookiecutter.model_plural_lower}}/${new{{cookiecutter.model}}.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });

  it('adds new content with activity title and description', async () => {
    const playlist = playlistMockFactory();
    const new{{cookiecutter.model}} = {{cookiecutter.model_lower}}MockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/{{cookiecutter.model_url_part}}/', new{{cookiecutter.model}}, {
      overwriteRoutes: true,
    });

    const { container } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <SelectContent
          playlist={playlist}
          lti_select_form_action_url={appData.lti_select_form_action_url!}
          lti_select_form_data={{'{{'}}
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
            activity_title: 'Activity title',
            activity_description: 'Activity description',
          {{'}}'}}
        />
      </Suspense>,
    );

    const {{cookiecutter.model_lower}}Tab = await screen.findByRole('tab', {
      name: '{{cookiecutter.model_plural}}',
    });
    userEvent.click({{cookiecutter.model_lower}}Tab);
    userEvent.click(screen.getByText('Add a {{cookiecutter.model_lower}}'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/{{cookiecutter.model_url_part}}/', {
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
            url: `https://example.com/lti/{{cookiecutter.model_plural_lower}}/${new{{cookiecutter.model}}.id}`,
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
    const new{{cookiecutter.model}} = {{cookiecutter.model_lower}}MockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/{{cookiecutter.model_url_part}}/', new{{cookiecutter.model}}, {
      overwriteRoutes: true,
    });

    const { container } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <SelectContent
          playlist={playlist}
          lti_select_form_action_url={appData.lti_select_form_action_url!}
          lti_select_form_data={{'{{'}}
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
            activity_title: '',
            activity_description: '',
          {{'}}'}}
        />
      </Suspense>,
    );

    const {{cookiecutter.model_lower}}Tab = await screen.findByRole('tab', {
      name: '{{cookiecutter.model_plural}}',
    });
    userEvent.click({{cookiecutter.model_lower}}Tab);
    userEvent.click(screen.getByText('Add a {{cookiecutter.model_lower}}'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/{{cookiecutter.model_url_part}}/', {
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
            url: `https://example.com/lti/{{cookiecutter.model_plural_lower}}/${new{{cookiecutter.model}}.id}`,
            frame: [],
          },
        ],
      }),
    });
    expect(form).toHaveAttribute('action', '/lti/select/');
  });
});

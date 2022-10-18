import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';

import { {{cookiecutter.model_lower}}MockFactory } from 'apps/{{ cookiecutter.app_name }}/utils/tests/factories';
import { playlistMockFactory } from 'lib-components';
import render from 'utils/tests/render';

import SelectContentResource from '.';

jest.mock('apps/{{cookiecutter.app_name}}/data/{{cookiecutter.app_name}}AppData', () => ({
  {{cookiecutter.app_name}}AppData: {
    {{ cookiecutter.app_name_lower_plural }}: [
      {
        id: 1,
        title: '{{cookiecutter.app_name}} title',
        description: '{{cookiecutter.app_name}} description',
        lti_url: 'https://example.com/lti_url',
      },
    ],
    new_{{ cookiecutter.app_name_lower }}_url: 'https://example.com/lti/{{ cookiecutter.model_url_part }}/',
  },
}));

const currentPlaylist = playlistMockFactory();

const mockSetContentItemsValue = jest.fn();

describe('<SelectContentResource />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('displays available {{ cookiecutter.model_plural_capitalized }}', async () => {
    render(
      <SelectContentResource
        playlist={currentPlaylist}
        lti_select_form_data={{'{'}}{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByRole('heading', { name: '{{cookiecutter.app_name}}' });
    screen.getByText('Add a {{cookiecutter.model_lower}}');
    screen.getByTitle('Select {{cookiecutter.app_name}} title');
  });

  it('displays available {{ cookiecutter.model_plural_capitalized }} and select existing one', async () => {
    render(
      <SelectContentResource
        playlist={currentPlaylist}
        lti_select_form_data={{'{'}}{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByRole('heading', { name: '{{cookiecutter.app_name}}' });
    screen.getByText('Add a {{cookiecutter.model_lower}}');

    userEvent.click(screen.getByTitle('Select {{cookiecutter.app_name}} title'));

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti_url',
            frame: [],
            title: '{{cookiecutter.app_name}} title',
            text: '{{cookiecutter.app_name}} description',
          },
        ],
      }),
    );
  });

  it('displays available {{ cookiecutter.model_plural_capitalized }} and click to create a new one', async () => {
    const playlist = playlistMockFactory();
    const new{{ cookiecutter.model }} = {{cookiecutter.model_lower}}MockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/{{ cookiecutter.model_url_part }}/', new{{ cookiecutter.model }});
    render(
      <SelectContentResource
        playlist={playlist}
        lti_select_form_data={{'{'}}{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByRole('heading', { name: '{{cookiecutter.app_name}}' });
    screen.getByTitle('Select {{cookiecutter.app_name}} title');
    userEvent.click(screen.getByText('Add a {{cookiecutter.model_lower}}'));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/{{ cookiecutter.model_url_part }}/', {
          body: {
            playlist: playlist.id,
          },
          method: 'POST',
        }),
      ).toBe(true);
    });

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/{{ cookiecutter.model_url_part }}/${new{{ cookiecutter.model }}.id}`,
            frame: [],
          },
        ],
      }),
    );
  });
});

import { screen } from '@testing-library/react';
import React from 'react';

import { playlistMockFactory } from 'lib-components';
import render from 'utils/tests/render';

import SelectContentTab from '.';
import { Tabs } from 'grommet';

jest.mock('apps/{{cookiecutter.app_name}}/data/{{cookiecutter.app_name}}AppData', () => ({
  {{cookiecutter.app_name}}AppData: {
    {{ cookiecutter.app_name_lower_plural }}: [
      {
        id: 1,
        title: '{{cookiecutter.app_name}} title',
        description: '{{cookiecutter.app_name}} description',
        lti_url: 'http://example.com/lti_url',
      },
    ],
    new_{{ cookiecutter.app_name_lower }}_url: 'https://example.com/lti/{{cookiecutter.model}}/',
  },
}));

describe('<SelectContentTab />', () => {
  afterEach(jest.resetAllMocks);

  it('selects content', () => {
    const currentPlaylist = playlistMockFactory();
    render(
      <Tabs>
        <SelectContentTab
          playlist={currentPlaylist}
          lti_select_form_data={{'{'}}{
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
          }}
          setContentItemsValue={jest.fn()}
        />
      </Tabs>,
    );

    screen.getByRole('tab', { name: '{{cookiecutter.app_name}}' });
    screen.getByText('Add a {{cookiecutter.model_lower}}');
    screen.getByTitle('Select {{cookiecutter.app_name}} title');
  });
});

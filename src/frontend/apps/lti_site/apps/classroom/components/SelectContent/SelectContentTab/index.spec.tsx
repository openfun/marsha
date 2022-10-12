import { screen } from '@testing-library/react';
import { Tabs } from 'grommet';
import React from 'react';

import { playlistMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import SelectContentTab from '.';

jest.mock('apps/classroom/data/classroomAppData', () => ({
  classroomAppData: {
    classrooms: [
      {
        id: '1',
        lti_url: 'https://example.com/lti_url',
        title: 'classroom title',
        description: 'classroom description',
        started: true,
      },
    ],
    new_classroom_url: 'https://example.com/classroom/',
  },
}));

const mockSetContentItemsValue = jest.fn();

describe('<SelectContentTab />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('displays the content section in a tab', async () => {
    const currentPlaylist = playlistMockFactory();
    render(
      <Tabs>
        <SelectContentTab
          playlist={currentPlaylist}
          lti_select_form_data={{
            lti_response_url: 'https://example.com/lti',
            lti_message_type: 'ContentItemSelection',
          }}
          setContentItemsValue={mockSetContentItemsValue}
        />
      </Tabs>,
    );

    screen.getByRole('tab', { name: 'classrooms' });
    screen.getByText('Add a classroom');
    screen.getByTitle('Select classroom title');
  });
});

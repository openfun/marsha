import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';

import { classroomMockFactory } from 'lib-classroom';
import { playlistMockFactory } from 'lib-components';
import render from 'utils/tests/render';

import SelectContentResource from '.';

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
    new_classroom_url: 'https://example.com/lti/classrooms/',
  },
}));

const currentPlaylist = playlistMockFactory();

const mockSetContentItemsValue = jest.fn();

describe('<SelectContentResource />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('displays available classrooms', async () => {
    render(
      <SelectContentResource
        playlist={currentPlaylist}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByRole('heading', { name: 'classrooms' });
    screen.getByText('Add a classroom');

    screen.getByLabelText('Select classroom title');
  });

  it('displays available classrooms and select existing one', async () => {
    render(
      <SelectContentResource
        playlist={currentPlaylist}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByRole('heading', { name: 'classrooms' });
    screen.getByText('Add a classroom');

    userEvent.click(screen.getByLabelText('Select classroom title'));

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti_url',
            frame: [],
            title: 'classroom title',
            text: 'classroom description',
          },
        ],
      }),
    );
  });

  it('displays available classrooms and click to create a new one', async () => {
    const playlist = playlistMockFactory();
    const newClassroom = classroomMockFactory({
      title: null,
      description: null,
    });
    fetchMock.post('/api/classrooms/', newClassroom);
    render(
      <SelectContentResource
        playlist={playlist}
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByRole('heading', { name: 'classrooms' });
    screen.getByLabelText('Select classroom title');
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
    });

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: `https://example.com/lti/classrooms/${newClassroom.id}`,
            frame: [],
          },
        ],
      }),
    );
  });
});

import { getDefaultNormalizer, screen } from '@testing-library/react';
import { classroomMockFactory } from 'lib-classroom';
import { playlistMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import ClassRoom from './ClassRoomItem';

const classroom = {
  welcome_text: 'Welcome!',
  description: 'Nouvelle Classroom description',
  title: 'Nouvelle Classroom title',
  starting_at: '2022-10-18T11:00:00Z',
  estimated_duration: '01:23:00',
  playlist: {
    ...playlistMockFactory(),
    title: 'Nouvelle Playlist title',
  },
};

describe('<ClassRoom />', () => {
  test('renders ClassRoom', () => {
    render(<ClassRoom classroom={classroomMockFactory(classroom)} />);

    expect(screen.getByText(/Welcome!/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Nouvelle Classroom description/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nouvelle Classroom title/i)).toBeInTheDocument();
    expect(
      screen.getByText('10/18/2022  ·  11:00:00 AM', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('01:23:00')).toBeInTheDocument();
    expect(screen.getByText('Nouvelle Playlist title')).toBeInTheDocument();
  });
});

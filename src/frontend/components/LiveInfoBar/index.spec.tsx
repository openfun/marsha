import { screen } from '@testing-library/react';
import React from 'react';
import { useParticipantsStore } from 'data/stores/useParticipantsStore/index';

import render from 'utils/tests/render';

import { LiveInfoBar } from '.';

describe('<LiveInfoBar />', () => {
  it('renders placeholder title, startDate and viewers connected', () => {
    useParticipantsStore.setState({
      participants: [
        {
          id: 'id-anonymous',
          isInstructor: false,
          isOnStage: false,
          name: 'my anonymous name',
        },
        {
          id: 'id-anonymous-2',
          isInstructor: false,
          isOnStage: true,
          name: 'my anonymous name 2',
        },
        {
          id: 'id-named',
          isInstructor: false,
          isOnStage: false,
          name: 'my name',
        },
        {
          id: 'id-instructor',
          isInstructor: true,
          isOnStage: true,
          name: 'my instructor',
        },
      ],
    });

    render(<LiveInfoBar title={'title'} startDate={'some date'} />);

    screen.getByRole('heading', { name: 'title' });
    screen.getByText('some date');
    screen.getByText('4 viewers connected.');
  });
});

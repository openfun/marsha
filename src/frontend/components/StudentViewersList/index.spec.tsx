import { Grommet } from 'grommet';
import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { useParticipantsStore } from 'data/stores/useParticipantsStore';
import { imageSnapshot } from 'utils/tests/imageSnapshot';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { theme } from 'utils/theme/theme';
import { StudentViewersList } from '.';
import { GlobalStyles } from 'utils/theme/baseStyles';

describe('<StudentViewersList />', () => {
  it('adds and removes several users from the list.', () => {
    render(wrapInIntlProvider(<StudentViewersList />));
    expect(screen.queryByText('On stage')).toEqual(null);
    screen.getByText('Other participants');

    act(() =>
      useParticipantsStore.getState().addParticipant({
        isInstructor: true,
        isOnStage: true,
        name: 'Instructor',
      }),
    );
    screen.getByText('Instructor');

    act(() =>
      useParticipantsStore.getState().addParticipant({
        isInstructor: false,
        isOnStage: false,
        name: 'Student 1',
      }),
    );
    screen.getByText('Student 1');

    act(() =>
      useParticipantsStore.getState().addParticipant({
        isInstructor: false,
        isOnStage: false,
        name: 'Student 2',
      }),
    );
    screen.getByText('Student 2');

    act(() => useParticipantsStore.getState().removeParticipant('Student 2'));
    expect(screen.queryByText('Student 2')).not.toBeInTheDocument();
  });

  it('renders StudentViewersList component with data, and compares it with previous render.', async () => {
    render(
      wrapInIntlProvider(
        <Grommet theme={theme}>
          <StudentViewersList />
          <GlobalStyles />
        </Grommet>,
      ),
    );

    act(() =>
      useParticipantsStore.getState().addParticipant({
        isInstructor: true,
        isOnStage: true,
        name: 'Instructor',
      }),
    );

    act(() =>
      useParticipantsStore.getState().addParticipant({
        isInstructor: false,
        isOnStage: false,
        name: 'Student 1',
      }),
    );

    act(() =>
      useParticipantsStore.getState().addParticipant({
        isInstructor: false,
        isOnStage: false,
        name: 'Student 2',
      }),
    );

    act(() =>
      useParticipantsStore.getState().addParticipant({
        isInstructor: false,
        isOnStage: true,
        name: 'Student 3',
      }),
    );

    await imageSnapshot();

    act(() => useParticipantsStore.getState().removeParticipant('Student 2'));

    await imageSnapshot();
  });
});

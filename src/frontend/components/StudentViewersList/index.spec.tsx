import { act, render, screen } from '@testing-library/react';
import { Grommet } from 'grommet';
import React from 'react';

import { useParticipantsStore } from 'data/stores/useParticipantsStore';
import {
  participantMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import { imageSnapshot } from 'utils/tests/imageSnapshot';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { GlobalStyles } from 'utils/theme/baseStyles';
import { theme } from 'utils/theme/theme';

import { StudentViewersList } from '.';

describe('<StudentViewersList />', () => {
  it('adds and removes several users from the list.', () => {
    const video = videoMockFactory();
    const { rerender } = render(
      wrapInIntlProvider(<StudentViewersList video={video} />),
    );
    expect(screen.queryByText('On stage')).toEqual(null);
    screen.getByText('Other participants');

    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.instructor@prosody.org',
        isInstructor: true,
        isOnStage: true,
        name: 'Instructor',
      }),
    );
    screen.getByText('Instructor');

    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.student1@prosody.org',
        isInstructor: false,
        isOnStage: false,
        name: 'Student 1',
      }),
    );
    screen.getByText('Student 1');

    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.student2@prosody.org',
        isInstructor: false,
        isOnStage: false,
        name: 'Student 2',
      }),
    );
    screen.getByText('Student 2');

    act(() => useParticipantsStore.getState().removeParticipant('Student 2'));
    expect(screen.queryByText('Student 2')).not.toBeInTheDocument();

    const student2 = participantMockFactory({ name: 'Student 2' });
    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.student2@prosody.org',
        isInstructor: false,
        isOnStage: false,
        name: 'Student 2',
      }),
    );
    rerender(
      wrapInIntlProvider(
        <StudentViewersList
          video={{ ...video, participants_in_discussion: [student2] }}
        />,
      ),
    );
    screen.getByText('Student 2');
  });

  it('renders StudentViewersList component with data, and compares it with previous render.', async () => {
    const video = videoMockFactory();
    render(
      wrapInIntlProvider(
        <Grommet theme={theme}>
          <StudentViewersList video={video} />
          <GlobalStyles />
        </Grommet>,
      ),
    );

    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.instructor@prosody.org',
        isInstructor: true,
        isOnStage: true,
        name: 'Instructor',
      }),
    );

    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.student1@prosody.org',
        isInstructor: false,
        isOnStage: false,
        name: 'Student 1',
      }),
    );

    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.student2@prosody.org',
        isInstructor: false,
        isOnStage: false,
        name: 'Student 2',
      }),
    );

    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.student3@prosody.org',
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

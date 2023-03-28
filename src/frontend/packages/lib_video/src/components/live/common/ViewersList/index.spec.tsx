import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  participantMockFactory,
  videoMockFactory,
  JoinMode,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { useParticipantsStore } from '@lib-video/hooks/useParticipantsStore';
import { generateAnonymousNickname } from '@lib-video/utils/chat/chat';
import { converse } from '@lib-video/utils/window';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { ViewersList } from '.';

jest.mock('utils/window', () => ({
  converse: {
    acceptParticipantToJoin: jest.fn(),
    askParticipantToJoin: jest.fn(),
    kickParticipant: jest.fn(),
    rejectParticipantToJoin: jest.fn(),
  },
}));

const mockedParticipantOnDemands1 = participantMockFactory();
const mockedParticipantOnDemands2 = participantMockFactory();

const mockedParticipantOnStage1 = participantMockFactory();
const mockedParticipantOnStage2 = participantMockFactory();

const mockedParticipantOnStage1Full = {
  ...mockedParticipantOnStage1,
  userJid: 'userJid-stage1',
  isInstructor: false,
  isOnStage: true,
};

const mockedParticipantOnStage2Full = {
  ...mockedParticipantOnStage2,
  userJid: 'userJid-stage2',
  isInstructor: false,
  isOnStage: true,
};

const participant1 = {
  id: 'example.jid.student1@prosody.org',
  userJid: 'userJid-student1',
  isInstructor: true,
  isOnStage: false,
  name: 'Student 1',
};

const participant2 = {
  id: 'example.jid.student2@prosody.org',
  userJid: 'userJid-student2',
  isInstructor: false,
  isOnStage: false,
  name: 'Student 2',
};

const participant3 = {
  id: 'example.jid.student3@prosody.org',
  userJid: 'userJid-student3',
  isInstructor: false,
  isOnStage: false,
  name: 'Student 3',
};

describe('<ViewersList /> when user is an instructor', () => {
  beforeEach(() => jest.resetAllMocks());

  it('displays severals participants, not on stage and not asking, and then remove some of them', () => {
    const video = videoMockFactory();

    render(wrapInVideo(<ViewersList isInstructor={true} />, video));

    expect(screen.queryByText('Demands')).not.toBeInTheDocument();
    screen.getByText('On stage (0)');
    screen.getByText(
      'Oops, nobody is on stage. Wait for your teacher to ask joining the stage.',
    );
    screen.getByText('Other participants (0)');
    screen.getByText('No viewers are currently connected to your stream.');

    act(() => useParticipantsStore.getState().addParticipant(participant1));
    act(() => useParticipantsStore.getState().addParticipant(participant2));
    act(() => useParticipantsStore.getState().addParticipant(participant3));

    screen.getByText('Student 1');
    screen.getByText('Student 2');
    screen.getByText('Student 3');

    act(() => useParticipantsStore.getState().removeParticipant('Student 2'));

    expect(screen.queryByText('Student 2')).not.toBeInTheDocument();
  });

  it('displays severals participants, some on stage, and some asking, and some not on stage and not asking', () => {
    const video = videoMockFactory({
      participants_asking_to_join: [
        mockedParticipantOnDemands1,
        mockedParticipantOnDemands2,
      ],
      participants_in_discussion: [
        mockedParticipantOnStage1,
        mockedParticipantOnStage2,
      ],
    });

    useParticipantsStore.setState({
      participants: [
        participant1,
        participant2,
        mockedParticipantOnStage1Full,
        mockedParticipantOnStage2Full,
      ],
    });

    render(wrapInVideo(<ViewersList isInstructor={true} />, video));

    expect(screen.getByText('Demands (2)')).toBeInTheDocument();
    screen.getByText('On stage (3)');
    screen.getByText('Other participants (1)');

    screen.getByText('Student 1');
    screen.getByText('Student 2');
    screen.getByText(mockedParticipantOnDemands1.name);
    screen.getByText(mockedParticipantOnDemands2.name);
    screen.getByText(mockedParticipantOnStage1Full.name);
    screen.getByText(mockedParticipantOnStage2Full.name);
  });

  it('displays a demanding participant and accepts it', () => {
    const video = videoMockFactory({
      participants_asking_to_join: [mockedParticipantOnDemands1],
    });

    render(wrapInVideo(<ViewersList isInstructor={true} />, video));

    screen.getByText('Demands (1)');
    screen.getByText('On stage (0)');
    screen.getByText(
      'Oops, nobody is on stage. Wait for your teacher to ask joining the stage.',
    );
    screen.getByText('Other participants (0)');
    screen.getByText('No viewers are currently connected to your stream.');
    screen.getByText(mockedParticipantOnDemands1.name);

    const acceptButton = screen.getByRole('button', { name: 'Accept' });

    userEvent.click(acceptButton);

    expect(converse.acceptParticipantToJoin).toHaveBeenCalledTimes(1);
  });

  it('displays a demanding participant and rejects it', () => {
    const video = videoMockFactory({
      participants_asking_to_join: [mockedParticipantOnDemands1],
    });

    render(wrapInVideo(<ViewersList isInstructor={true} />, video));

    screen.getByText('Demands (1)');
    screen.getByText('On stage (0)');
    screen.getByText(
      'Oops, nobody is on stage. Wait for your teacher to ask joining the stage.',
    );
    screen.getByText('Other participants (0)');
    screen.getByText('No viewers are currently connected to your stream.');
    screen.getByText(mockedParticipantOnDemands1.name);

    const rejectButton = screen.getAllByRole('button')[0];

    userEvent.click(rejectButton);

    expect(converse.rejectParticipantToJoin).toHaveBeenCalledTimes(1);
  });

  it('displays an on-stage participant and kicks it', () => {
    const video = videoMockFactory({
      participants_in_discussion: [mockedParticipantOnStage1],
    });

    useParticipantsStore.setState({
      participants: [mockedParticipantOnStage1Full],
    });

    render(wrapInVideo(<ViewersList isInstructor={true} />, video));

    expect(screen.queryByText('Demands')).not.toBeInTheDocument();
    screen.getByText('On stage (1)');
    screen.getByText('Other participants (0)');
    screen.getByText('No viewers are currently connected to your stream.');
    screen.getByText(mockedParticipantOnStage1Full.name);

    const terminateButton = screen.getByRole('button', { name: 'Terminate' });

    userEvent.click(terminateButton);

    expect(converse.kickParticipant).toHaveBeenCalledTimes(1);
  });

  it('does not display the kick button when join mode is forced', () => {
    const video = videoMockFactory({
      join_mode: JoinMode.FORCED,
      participants_in_discussion: [mockedParticipantOnStage1],
    });

    useParticipantsStore.setState({
      participants: [mockedParticipantOnStage1Full],
    });

    render(wrapInVideo(<ViewersList isInstructor={true} />, video));

    expect(screen.queryByText('Terminate')).not.toBeInTheDocument();
  });

  it('does not display participants not in stage list when join mode is forced', () => {
    const video = videoMockFactory({ join_mode: JoinMode.FORCED });

    render(wrapInVideo(<ViewersList isInstructor={true} />, video));

    expect(screen.queryByText('Other participants')).not.toBeInTheDocument();
    expect(
      screen.queryByText('No viewers are currently connected to your stream.'),
    ).not.toBeInTheDocument();
  });

  it('does not display anonymous users in the list but inform with a message', () => {
    const video = videoMockFactory();
    const anonymousName = generateAnonymousNickname();
    useParticipantsStore.setState({
      participants: [
        {
          id: 'id-anonymous',
          userJid: 'userJid-anonymous',
          isInstructor: false,
          isOnStage: false,
          name: anonymousName,
        },
        {
          id: 'id-named',
          userJid: 'userJid-anonymous',
          isInstructor: false,
          isOnStage: false,
          name: 'my name',
        },
      ],
    });

    render(wrapInVideo(<ViewersList isInstructor={true} />, video));

    screen.getByText('my name');
    expect(screen.queryByText(anonymousName)).not.toBeInTheDocument();
    screen.getByText('And 1 anonymous viewer.');
  });
});

describe('<ViewersList /> when user is a student', () => {
  it('adds and removes several users from the list.', () => {
    const video = videoMockFactory();
    const { rerender } = render(
      wrapInVideo(<ViewersList isInstructor={false} />, video),
    );

    expect(screen.queryByText('Demands')).not.toBeInTheDocument();
    screen.getByText('On stage (0)');
    screen.getByText(
      'Oops, nobody is on stage. Wait for your teacher to ask joining the stage.',
    );
    screen.getByText('Other participants (0)');
    screen.getByText('No viewers are currently connected to your stream.');

    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.instructor@prosody.org',
        userJid: 'userJid-instructor',
        isInstructor: true,
        isOnStage: true,
        name: 'Instructor',
      }),
    );
    screen.getByText('Instructor');

    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.student1@prosody.org',
        userJid: 'userJid-student1',
        isInstructor: false,
        isOnStage: false,
        name: 'Student 1',
      }),
    );
    screen.getByText('Student 1');

    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.student2@prosody.org',
        userJid: 'userJid-student2',
        isInstructor: false,
        isOnStage: false,
        name: 'Student 2',
      }),
    );
    screen.getByText('Student 2');

    expect(screen.queryByText('Demands')).toEqual(null);

    act(() => useParticipantsStore.getState().removeParticipant('Student 2'));
    expect(screen.queryByText('Student 2')).not.toBeInTheDocument();

    act(() =>
      useParticipantsStore.getState().addParticipant({
        id: 'example.jid.student2@prosody.org',
        userJid: 'userJid-student2',
        isInstructor: false,
        isOnStage: false,
        name: 'Student 2',
      }),
    );

    rerender(wrapInVideo(<ViewersList isInstructor={false} />, video));

    screen.getByText('Student 2');
  });

  it('displays number of anonymous when there is some', () => {
    const video = videoMockFactory();

    useParticipantsStore.setState({
      participants: [
        { ...participant1, isInstructor: false, name: 'anonymous-XXX' },
        { ...participant2, name: 'anonymous-YYY' },
        { ...participant3, name: 'anonymous-ZZZ' },
      ],
    });

    render(wrapInVideo(<ViewersList isInstructor={false} />, video));

    expect(screen.getByText('Other participants (0)')).toBeInTheDocument();
    expect(
      screen.queryByText('No viewers are currently connected to your stream.'),
    ).not.toBeInTheDocument();
    screen.getByText('3 anonymous viewers.');
  });
});

import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { classroomInfosMockFactory } from '@lib-classroom/tests/factories';

import DashboardClassroomInfos from '.';

describe('<DashboardClassroomInfos />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('displays the content for classroom infos', () => {
    const classroomInfos = classroomInfosMockFactory();
    render(
      <DashboardClassroomInfos
        inviteToken={null}
        instructorToken={null}
        infos={classroomInfos}
        classroomId="1"
      />,
    );

    expect(screen.getByText('Moderators')).toBeInTheDocument();
    expect(screen.getByText('Participants')).toBeInTheDocument();
    expect(screen.getByText('Listeners')).toBeInTheDocument();
    expect(screen.getByText(classroomInfos.moderatorCount)).toBeInTheDocument();
    expect(
      screen.getByText(classroomInfos.voiceParticipantCount),
    ).toBeInTheDocument();
    expect(screen.getByText(classroomInfos.listenerCount)).toBeInTheDocument();
    expect(
      screen.queryByText('Invite a viewer with this link:'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('LTI link for this classroom:'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('https://localhost/lti/classrooms/1'),
    ).toBeInTheDocument();
  });

  it('displays invite link', () => {
    render(
      <DashboardClassroomInfos
        inviteToken="my-token"
        instructorToken={null}
        classroomId="1"
      />,
    );

    expect(
      screen.getByText('Invite a viewer with this link:'),
    ).toBeInTheDocument();
    expect(screen.getByText(/invite\/my-token/i)).toBeInTheDocument();
  });

  it('displays moderator link', () => {
    render(
      <DashboardClassroomInfos
        inviteToken={null}
        instructorToken="my-token"
        classroomId="1"
      />,
    );

    expect(
      screen.getByText('Invite a moderator with this link:'),
    ).toBeInTheDocument();
    expect(screen.getByText(/invite\/my-token/i)).toBeInTheDocument();
  });
});

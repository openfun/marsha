import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { classroomInfosMockFactory } from 'utils/tests/factories';

import DashboardClassroomInfos from '.';

describe('<DashboardClassroomInfos />', () => {
  it('displays the content for classroom infos', () => {
    const classroomInfos = classroomInfosMockFactory();
    render(<DashboardClassroomInfos infos={classroomInfos} />);

    expect(screen.getByText('Moderators')).toBeInTheDocument();
    expect(screen.getByText('Participants')).toBeInTheDocument();
    expect(screen.getByText('Listeners')).toBeInTheDocument();
    expect(screen.getByText(classroomInfos.moderatorCount)).toBeInTheDocument();
    expect(
      screen.getByText(classroomInfos.voiceParticipantCount),
    ).toBeInTheDocument();
    expect(screen.getByText(classroomInfos.listenerCount)).toBeInTheDocument();
  });
});

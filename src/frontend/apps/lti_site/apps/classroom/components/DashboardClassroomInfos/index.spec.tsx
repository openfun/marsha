import React from 'react';

import { classroomInfosMockFactory } from 'lib-classroom';
import render from 'utils/tests/render';

import DashboardClassroomInfos from '.';

describe('<DashboardClassroomInfos />', () => {
  it('displays the content for classroom infos', () => {
    const classroomInfos = classroomInfosMockFactory();
    const { getByText } = render(
      <DashboardClassroomInfos infos={classroomInfos} />,
    );
    getByText('Moderators');
    getByText('Participants');
    getByText('Listeners');
    getByText(classroomInfos.moderatorCount);
    getByText(classroomInfos.voiceParticipantCount);
    getByText(classroomInfos.listenerCount);
  });
});

import { render } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { classroomInfosMockFactory } from 'apps/bbb/utils/tests/factories';

import DashboardClassroomInfos from '.';

describe('<DashboardClassroomInfos />', () => {
  it('displays the content for classroom infos', () => {
    const classroomInfos = classroomInfosMockFactory();
    const { getByText } = render(
      wrapInIntlProvider(<DashboardClassroomInfos infos={classroomInfos} />),
    );
    getByText('Moderators');
    getByText('Participants');
    getByText('Listeners');
    getByText(classroomInfos.moderatorCount);
    getByText(classroomInfos.voiceParticipantCount);
    getByText(classroomInfos.listenerCount);
  });
});

import { render } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { meetingInfosMockFactory } from 'apps/bbb/utils/tests/factories';

import DashboardMeetingInfos from '.';

describe('<DashboardMeetingInfos />', () => {
  it('displays the content for meeting infos', () => {
    const meetingInfos = meetingInfosMockFactory();
    const { getByText } = render(
      wrapInIntlProvider(<DashboardMeetingInfos infos={meetingInfos} />),
    );
    getByText('Moderators');
    getByText('Participants');
    getByText('Listeners');
    getByText(meetingInfos.moderatorCount);
    getByText(meetingInfos.voiceParticipantCount);
    getByText(meetingInfos.listenerCount);
  });
});

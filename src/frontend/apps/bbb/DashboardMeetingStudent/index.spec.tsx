import { render } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { meetingMockFactory } from 'apps/bbb/utils/tests/factories';
import DashboardMeetingStudent from '.';

describe('<DashboardMeetingStudent />', () => {
  it('Displays message and triggers callbacks depending on meeting state', () => {
    const meeting = meetingMockFactory({ id: '1', started: false });
    const joinMeetingAction = jest.fn();
    const meetingEnded = jest.fn();

    const { getByText, rerender } = render(
      wrapInIntlProvider(
        <DashboardMeetingStudent
          meeting={meeting}
          joinMeetingAction={joinMeetingAction}
          meetingEnded={meetingEnded}
        />,
      ),
    );

    getByText('Meeting not started yet.');
    expect(joinMeetingAction).toHaveBeenCalledTimes(0);
    expect(meetingEnded).toHaveBeenCalledTimes(1);

    // meeting starts
    rerender(
      wrapInIntlProvider(
        <DashboardMeetingStudent
          meeting={{ ...meeting, started: true }}
          joinMeetingAction={joinMeetingAction}
          meetingEnded={meetingEnded}
        />,
      ),
    );
    getByText('You should be redirected to the meeting.');
    expect(joinMeetingAction).toHaveBeenCalledTimes(1);
    expect(meetingEnded).toHaveBeenCalledTimes(1);

    // meeting ends
    rerender(
      wrapInIntlProvider(
        <DashboardMeetingStudent
          meeting={{ ...meeting, started: false }}
          joinMeetingAction={joinMeetingAction}
          meetingEnded={meetingEnded}
        />,
      ),
    );
    getByText('Meeting not started yet.');
    expect(joinMeetingAction).toHaveBeenCalledTimes(1);
    expect(meetingEnded).toHaveBeenCalledTimes(2);
  });
});

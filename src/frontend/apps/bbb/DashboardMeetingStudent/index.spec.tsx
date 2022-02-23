import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { meetingMockFactory } from 'apps/bbb/utils/tests/factories';
import DashboardMeetingStudent from '.';

describe('<DashboardMeetingStudent />', () => {
  it('Displays message and triggers callbacks depending on meeting state', () => {
    const meeting = meetingMockFactory({
      id: '1',
      started: false,
      ended: false,
    });
    const joinMeetingAction = jest.fn();
    const meetingEnded = jest.fn();

    const { getByText, rerender } = render(
      wrapInIntlProvider(
        <DashboardMeetingStudent
          meeting={meeting}
          joinedAs={false}
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
          meeting={{ ...meeting, started: true, ended: false }}
          joinedAs={false}
          joinMeetingAction={joinMeetingAction}
          meetingEnded={meetingEnded}
        />,
      ),
    );
    fireEvent.click(screen.getByText('Join meeting'));
    expect(joinMeetingAction).toHaveBeenCalledTimes(1);
    expect(meetingEnded).toHaveBeenCalledTimes(1);

    // meeting joined
    rerender(
      wrapInIntlProvider(
        <DashboardMeetingStudent
          meeting={{ ...meeting, started: true, ended: false }}
          joinedAs="John Doe"
          joinMeetingAction={joinMeetingAction}
          meetingEnded={meetingEnded}
        />,
      ),
    );
    getByText('You have joined the meeting as John Doe.');
    expect(joinMeetingAction).toHaveBeenCalledTimes(1);
    expect(meetingEnded).toHaveBeenCalledTimes(1);

    // meeting ends
    rerender(
      wrapInIntlProvider(
        <DashboardMeetingStudent
          meeting={{ ...meeting, started: false, ended: true }}
          joinedAs={false}
          joinMeetingAction={joinMeetingAction}
          meetingEnded={meetingEnded}
        />,
      ),
    );
    getByText('Meeting ended.');
    expect(joinMeetingAction).toHaveBeenCalledTimes(1);
    expect(meetingEnded).toHaveBeenCalledTimes(2);
  });
});

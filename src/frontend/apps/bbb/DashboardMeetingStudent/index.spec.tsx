import { fireEvent, render, screen } from '@testing-library/react';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { meetingMockFactory } from 'apps/bbb/utils/tests/factories';
import DashboardMeetingStudent from '.';

jest.mock('data/appData', () => ({
  appData: {
    static: {
      img: {
        bbbBackground: 'some_url',
      },
    },
  },
}));

Settings.defaultLocale = 'en';
Settings.defaultZone = 'utc';
const currentDate = DateTime.local(2022, 1, 27, 14, 22, 15);

describe('<DashboardMeetingStudent />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(currentDate.toJSDate());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.useRealTimers();
  });
  it('Displays message and triggers callbacks depending on meeting state', async () => {
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
    expect(meetingEnded).toHaveBeenCalledTimes(0);

    // meeting scheduled
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const exstimatedDuration = Duration.fromObject({ hours: 3 });
    const endingDateTime = startingAt.plus(exstimatedDuration);
    rerender(
      wrapInIntlProvider(
        <DashboardMeetingStudent
          meeting={{
            ...meeting,
            started: false,
            ended: false,
            starting_at: startingAt.toISO(),
            estimated_duration: exstimatedDuration.toFormat('hh:mm:ss'),
          }}
          joinedAs={false}
          joinMeetingAction={joinMeetingAction}
          meetingEnded={meetingEnded}
        />,
      ),
    );
    getByText(meeting.title!);
    getByText(meeting.description);
    const displayedStartingDate = startingAt.toLocaleString(DateTime.DATE_HUGE);
    const displayedStartingTime = startingAt.toLocaleString(
      DateTime.TIME_24_SIMPLE,
    );
    const displayedEndingTime = endingDateTime.toLocaleString(
      DateTime.TIME_24_SIMPLE,
    );
    getByText(
      `${displayedStartingDate} - ${displayedStartingTime} > ${displayedEndingTime}`,
    );
    expect(meetingEnded).toHaveBeenCalledTimes(0);

    // meeting scheduled without estimated duration
    rerender(
      wrapInIntlProvider(
        <DashboardMeetingStudent
          meeting={{
            ...meeting,
            started: false,
            ended: false,
            starting_at: startingAt.toISO(),
          }}
          joinedAs={false}
          joinMeetingAction={joinMeetingAction}
          meetingEnded={meetingEnded}
        />,
      ),
    );
    getByText(`${displayedStartingDate} - ${displayedStartingTime}`);

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
    fireEvent.click(screen.getByText('Click here to access meeting'));
    expect(joinMeetingAction).toHaveBeenCalledTimes(1);
    expect(meetingEnded).toHaveBeenCalledTimes(0);

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
    expect(meetingEnded).toHaveBeenCalledTimes(0);

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
    expect(meetingEnded).toHaveBeenCalledTimes(1);
  });
});

import { act, render } from '@testing-library/react';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { meetingMockFactory } from 'apps/bbb/utils/tests/factories';
import { DashboardMeetingStudentCounter } from '.';

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

describe('<DashboardMeetingStudentCounter />', () => {
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

  it('Displays a countdown when the meeting is scheduled', async () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const exstimatedDuration = Duration.fromObject({ hours: 3 });

    const meeting = meetingMockFactory({
      id: '1',
      started: false,
      ended: false,
      starting_at: startingAt.toISO(),
      estimated_duration: exstimatedDuration.toFormat('hh:mm:ss'),
    });

    const { container } = render(
      wrapInIntlProvider(<DashboardMeetingStudentCounter meeting={meeting} />),
    );

    const expectCountdown = (
      days: number,
      hours: number,
      minutes: number,
      seconds: number,
    ) => {
      expect(container).toHaveTextContent(`${days}days`);
      expect(container).toHaveTextContent(`${hours}hours`);
      expect(container).toHaveTextContent(`${minutes}minutes`);
      expect(container).toHaveTextContent(`${seconds}seconds`);
    };

    expectCountdown(2, 1, 37, 45);

    act(() => {
      jest.advanceTimersByTime(
        Duration.fromObject({ hours: 1, minutes: 20 }).toMillis(),
      );
    });

    expectCountdown(2, 0, 17, 45);
  });
});

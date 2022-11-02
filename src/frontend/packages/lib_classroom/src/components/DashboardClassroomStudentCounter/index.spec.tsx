import { act } from '@testing-library/react';
import { render } from 'lib-tests';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';

import { classroomMockFactory } from 'utils/tests/factories';

import { DashboardClassroomStudentCounter } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: {
      img: {
        bbbBackground: 'some_url',
      },
    },
  }),
}));

Settings.defaultLocale = 'en';
const currentDate = DateTime.local(2022, 1, 27, 14, 22, 15);

describe('<DashboardClassroomStudentCounter />', () => {
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

  it('Displays a countdown when the classroom is scheduled', () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const exstimatedDuration = Duration.fromObject({ hours: 3 });

    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      ended: false,
      starting_at: startingAt.toISO(),
      estimated_duration: exstimatedDuration.toFormat('hh:mm:ss'),
    });

    const { container } = render(
      <DashboardClassroomStudentCounter classroom={classroom} />,
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

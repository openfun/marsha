import { act, waitFor } from '@testing-library/react';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';

import { classroomMockFactory } from 'apps/bbb/utils/tests/factories';
import render from 'utils/tests/render';

import { DashboardClassroomStudentCounter } from '.';

jest.mock('data/stores/useAppConfig', () => ({
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
    jest.useRealTimers();
  });

  it('Displays a countdown when the classroom is scheduled', async () => {
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

    const expectCountdown = async (
      days: number,
      hours: number,
      minutes: number,
      seconds: number,
    ) => {
      await waitFor(() => expect(container).toHaveTextContent(`${days}days`));
      await waitFor(() => expect(container).toHaveTextContent(`${hours}hours`));
      await waitFor(() =>
        expect(container).toHaveTextContent(`${minutes}minutes`),
      );
      await waitFor(() =>
        expect(container).toHaveTextContent(`${seconds}seconds`),
      );
    };

    await expectCountdown(2, 1, 37, 45);

    act(() => {
      const t = currentDate.plus({ hours: 1, minutes: 20 });
      jest.setSystemTime(t.toJSDate());

      jest.runAllTimers();
    });

    await expectCountdown(2, 0, 17, 44);
  });
});

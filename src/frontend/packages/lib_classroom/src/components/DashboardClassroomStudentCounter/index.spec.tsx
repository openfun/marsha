import { act, waitFor } from '@testing-library/react';
import { render } from 'lib-tests';
import { DateTime, Duration, Settings } from 'luxon';

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

  it('Displays a countdown when the classroom is scheduled', async () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const { container } = render(
      <DashboardClassroomStudentCounter
        starting_at={startingAt.toISO() as string}
      />,
    );

    const expectCountdown = async (
      days: number,
      hours: number,
      minutes: number,
    ) => {
      await waitFor(() => {
        expect(container).toHaveTextContent(`${days}days`);
      });
      await waitFor(
        () => {
          expect(container).toHaveTextContent(`${hours}hours`);
        },
        { timeout: 2000 },
      );
      await waitFor(
        () => {
          expect(container).toHaveTextContent(`${minutes}minutes`);
        },
        { timeout: 2000 },
      );
      await waitFor(
        () => {
          expect(container).toHaveTextContent(/[0-9]{2}seconds/);
        },
        { timeout: 2000 },
      );
    };

    await expectCountdown(2, 1, 37);

    act(() => {
      jest.advanceTimersByTime(
        Duration.fromObject({ hours: 1, minutes: 20 }).toMillis(),
      );
    });

    await expectCountdown(2, 0, 17);
  });
});

import { fireEvent, screen } from '@testing-library/react';
import { render } from 'lib-tests';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';

import { classroomMockFactory } from '@lib-classroom/utils/tests/factories';

import DashboardClassroomStudent from '.';

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
// Settings.defaultZone = 'utc';
const currentDate = DateTime.local(2022, 1, 27, 14, 22, 15);

describe('<DashboardClassroomStudent />', () => {
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
  it('Displays message and triggers callbacks depending on classroom state', () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      ended: false,
      title: 'Title',
      description: 'Description',
    });
    const joinClassroomAction = jest.fn();
    const classroomEnded = jest.fn();

    const { rerender } = render(
      <DashboardClassroomStudent
        classroom={classroom}
        joinedAs={false}
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );

    screen.getByText(classroom.title);
    screen.getByText(classroom.description);
    screen.getByText('Classroom not started yet.');
    expect(joinClassroomAction).toHaveBeenCalledTimes(0);
    expect(classroomEnded).toHaveBeenCalledTimes(0);

    // classroom scheduled
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const exstimatedDuration = Duration.fromObject({ hours: 3 });
    const endingDateTime = startingAt.plus(exstimatedDuration);
    rerender(
      <DashboardClassroomStudent
        classroom={{
          ...classroom,
          started: false,
          ended: false,
          starting_at: startingAt.toISO(),
          estimated_duration: exstimatedDuration.toFormat('hh:mm:ss'),
        }}
        joinedAs={false}
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );
    screen.getByText(classroom.title);
    screen.getByText(classroom.description);
    const displayedStartingDate = startingAt.toLocaleString(DateTime.DATE_HUGE);
    const displayedStartingTime = startingAt.toLocaleString(
      DateTime.TIME_24_SIMPLE,
    );
    const displayedEndingTime = endingDateTime.toLocaleString(
      DateTime.TIME_24_SIMPLE,
    );
    screen.getByText(
      `${displayedStartingDate} - ${displayedStartingTime} > ${displayedEndingTime}`,
    );
    expect(classroomEnded).toHaveBeenCalledTimes(0);

    // classroom scheduled without estimated duration
    rerender(
      <DashboardClassroomStudent
        classroom={{
          ...classroom,
          started: false,
          ended: false,
          starting_at: startingAt.toISO(),
        }}
        joinedAs={false}
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );
    screen.getByText(`${displayedStartingDate} - ${displayedStartingTime}`);

    // classroom starts
    rerender(
      <DashboardClassroomStudent
        classroom={{ ...classroom, started: true, ended: false }}
        joinedAs={false}
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );
    fireEvent.click(screen.getByText('Click here to access classroom'));
    expect(joinClassroomAction).toHaveBeenCalledTimes(1);
    expect(classroomEnded).toHaveBeenCalledTimes(0);

    // classroom joined
    rerender(
      <DashboardClassroomStudent
        classroom={{ ...classroom, started: true, ended: false }}
        joinedAs="John Doe"
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );
    screen.getByText('You have joined the classroom as John Doe.');
    expect(joinClassroomAction).toHaveBeenCalledTimes(1);
    expect(classroomEnded).toHaveBeenCalledTimes(0);

    // classroom ends
    rerender(
      <DashboardClassroomStudent
        classroom={{ ...classroom, started: false, ended: true }}
        joinedAs={false}
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );
    screen.getByText('Classroom ended.');
    expect(joinClassroomAction).toHaveBeenCalledTimes(1);
    expect(classroomEnded).toHaveBeenCalledTimes(1);
  });
});

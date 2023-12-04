import { fireEvent, screen } from '@testing-library/react';
import { render } from 'lib-tests';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';

import { classroomMockFactory } from '@lib-classroom/tests/factories';

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

jest.mock(
  'react-icalendar-link',
  () =>
    (props: {
      event: {
        description: string;
        endTime: string;
        startTime: string;
        title: string;
        url: string;
      };
    }) => {
      return (
        <span>
          <span>Add to my calendar</span>
          <span>description:{props.event.description}</span>
          <span>title:{props.event.title}</span>
          <span>startTime:{props.event.startTime}</span>
          <span>endlive:{props.event.endTime}</span>
          {props.event.url && <span>url:{props.event.url}</span>}
        </span>
      );
    },
);

Settings.defaultLocale = 'en';
// Settings.defaultZone = 'utc';
const currentDate = DateTime.local(2022, 1, 27, 14, 22, 15);

describe('<DashboardClassroomStudent />', () => {
  const nextYear = new Date().getFullYear() + 1;

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
    expect(screen.getByText('Add to my calendar')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();

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

  it("doesn't add a link to add to my calendar if there is no starting_at date", () => {
    const classroom = classroomMockFactory({
      title: 'classroom title',
      description: 'classroom description',
      started: false,
      ended: false,
    });

    const joinClassroomAction = jest.fn();
    const classroomEnded = jest.fn();

    render(
      <DashboardClassroomStudent
        classroom={classroom}
        joinedAs={false}
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Register' }),
    ).not.toBeInTheDocument();

    screen.getByText('classroom title');
    screen.getByText('classroom description');
    expect(
      screen.queryByLabelText('Click to add the event to your calendar'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Add to my calendar')).not.toBeInTheDocument();
  });

  it('uses default values for description, duration and title when the classroom has none for the ics link', () => {
    const classroom = classroomMockFactory({
      starting_at: DateTime.fromJSDate(
        new Date(nextYear, 1, 25, 11, 0, 0),
      ).toISO(),
      description: '',
      is_public: false,
      title: '',
      started: false,
      ended: false,
    });

    const joinClassroomAction = jest.fn();
    const classroomEnded = jest.fn();

    render(
      <DashboardClassroomStudent
        classroom={classroom}
        joinedAs={false}
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );
    screen.getByText('Add to my calendar');
    // default title
    screen.getByText("title:Don't miss the classroom!");
    // default description
    screen.getByText('description:Come and join us!');
    // date of the ics link
    screen.getByText(`startTime:${nextYear}-02-25T11:00:00.000+00:00`);
    // one hour has been added for the end
    screen.getByText(`endlive:${nextYear}-02-25T12:00:00.000+00:00`);
    // public is false, there is no URL
    expect(screen.queryByText('url:')).not.toBeInTheDocument();
  });

  it("creates a link when the classroom is public and uses video's info for the ics link", () => {
    const estimatedDuration = Duration.fromObject({ hours: 6, minutes: 15 });
    const year = new Date().getFullYear() + 1;
    const classroom = classroomMockFactory({
      starting_at: DateTime.fromJSDate(new Date(year, 1, 25, 11, 0, 0)).toISO(),
      estimated_duration: estimatedDuration.toISOTime({
        suppressMilliseconds: true,
      }),
      description: 'this is the description',
      is_public: true,
      title: 'this is the title',
      started: false,
      ended: false,
    });
    const joinClassroomAction = jest.fn();
    const classroomEnded = jest.fn();

    render(
      <DashboardClassroomStudent
        classroom={classroom}
        joinedAs={false}
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );
    expect(screen.getByText('Add to my calendar')).toBeInTheDocument();

    // default title
    expect(screen.getByText('title:this is the title')).toBeInTheDocument();
    // default description
    expect(
      screen.getByText('description:this is the description'),
    ).toBeInTheDocument();
    // date of the ics link
    expect(
      screen.getByText(`startTime:${year}-02-25T11:00:00.000+00:00`),
    ).toBeInTheDocument();
    // duration has been added to calculate the end
    expect(
      screen.getByText(`endlive:${year}-02-25T17:15:00.000+00:00`),
    ).toBeInTheDocument();
  });
});

import { screen } from '@testing-library/react';
import { liveState } from 'lib-components';
import { advanceJestTimersByTime, render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import { StudentLiveScheduleInfo } from '.';

const mockSetTimeIsOver = jest.fn();

describe('<StudentLiveScheduleInfo />', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    //    set system date to 2022-01-27T14:00:00
    jest.setSystemTime(new Date(2022, 1, 27, 14, 0, 0));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('renders waiting message and starting date when scheduled date is expired', () => {
    const startDate = DateTime.fromJSDate(new Date(2022, 1, 27, 13, 59, 59));

    render(
      <StudentLiveScheduleInfo
        isTimeOver={false}
        setTimeIsOver={mockSetTimeIsOver}
        startDate={startDate}
        live_state={liveState.STOPPED}
      />,
    );

    screen.getByRole('heading', {
      name: 'This live has ended',
    });

    expect(mockSetTimeIsOver).toHaveBeenCalledTimes(1);
  });

  it('renders waiting message when live should start', () => {
    const startDate = DateTime.fromJSDate(new Date(2022, 2, 27, 13, 59, 59));

    render(
      <StudentLiveScheduleInfo
        isTimeOver={true}
        setTimeIsOver={mockSetTimeIsOver}
        startDate={startDate}
        live_state={liveState.STARTING}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Live is starting',
      }),
    ).toBeInTheDocument();
  });

  it('renders delay before event start and the date of the event when event is today', async () => {
    const startDate = DateTime.fromJSDate(new Date(2022, 1, 27, 15, 0, 0));

    render(
      <StudentLiveScheduleInfo
        isTimeOver={false}
        setTimeIsOver={mockSetTimeIsOver}
        startDate={startDate}
        live_state={liveState.RUNNING}
      />,
    );

    screen.getByRole('heading', {
      name: 'Live will start in 0 1 : 0 0 : 0 0',
    });
    screen.getByText(
      startDate.setLocale('en').toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
    );

    expect(mockSetTimeIsOver).not.toHaveBeenCalled();

    advanceJestTimersByTime(1000, 6000);

    await screen.findByRole('heading', {
      name: 'Live is starting',
    });

    expect(mockSetTimeIsOver).toHaveBeenCalledTimes(1);
  });

  it('renders info about event tomorrow and the date of the event when scheduled date is in the next calendar day', () => {
    const startDate = DateTime.fromJSDate(new Date(2022, 1, 28, 13, 0, 0));

    render(
      <StudentLiveScheduleInfo
        isTimeOver={false}
        setTimeIsOver={mockSetTimeIsOver}
        startDate={startDate}
        live_state={liveState.RUNNING}
      />,
    );

    screen.getByRole('heading', {
      name: `Live will start tomorrow at ${startDate
        .setLocale('en')
        .toLocaleString(DateTime.TIME_SIMPLE)}`,
    });
    screen.getByText(
      startDate.setLocale('en').toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
    );

    expect(mockSetTimeIsOver).not.toHaveBeenCalled();
  });

  it('renders info about event tomorrow and the date of the event when scheduled date is in more than 24 hours', () => {
    const startDate = DateTime.fromJSDate(new Date(2022, 1, 28, 15, 0, 0));

    render(
      <StudentLiveScheduleInfo
        isTimeOver={false}
        setTimeIsOver={mockSetTimeIsOver}
        startDate={startDate}
        live_state={liveState.RUNNING}
      />,
    );

    screen.getByRole('heading', {
      name: `Live will start tomorrow at ${startDate
        .setLocale('en')
        .toLocaleString(DateTime.TIME_SIMPLE)}`,
    });
    screen.getByText(
      startDate.setLocale('en').toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
    );

    expect(mockSetTimeIsOver).not.toHaveBeenCalled();
  });

  it('renders live info when event is in multiple days and date of the event', () => {
    const startDate = DateTime.fromJSDate(new Date(2022, 1, 29, 15, 0, 0));

    render(
      <StudentLiveScheduleInfo
        isTimeOver={false}
        setTimeIsOver={mockSetTimeIsOver}
        startDate={startDate}
        live_state={liveState.RUNNING}
      />,
    );

    screen.getByRole('heading', {
      name: `Live will start in 2 days at ${startDate
        .setLocale('en')
        .toLocaleString(DateTime.TIME_SIMPLE)}`,
    });
    screen.getByText(
      startDate.setLocale('en').toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
    );

    expect(mockSetTimeIsOver).not.toHaveBeenCalled();
  });
});

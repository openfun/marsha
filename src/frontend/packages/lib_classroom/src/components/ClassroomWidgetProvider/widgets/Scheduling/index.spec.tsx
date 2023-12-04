import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEventInit from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { InfoWidgetModalProvider } from 'lib-components';
import { Deferred, render, userTypeDatePicker } from 'lib-tests';
import { DateTime, Duration, Settings } from 'luxon';

import { classroomMockFactory } from '@lib-classroom/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { Scheduling } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'classrooms',
    resource: {
      id: '1',
    },
  }),
}));

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';

// eslint-disable-next-line testing-library/await-async-events
const userEvent = userEventInit.setup({
  advanceTimers: jest.advanceTimersByTime,
});

describe('<Scheduling />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('renders the widget', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Scheduling />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );
    expect(screen.getByText('Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Starting date')).toBeInTheDocument();
    expect(screen.getByText('Starting time')).toBeInTheDocument();
    expect(screen.getByText('Estimated duration')).toBeInTheDocument();
  });

  it('schedules a classroom', async () => {
    const startingAt = DateTime.local()
      .plus({ days: 1 })
      .set({ second: 0, millisecond: 0 });
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    let classroom = classroomMockFactory({ id: '1', started: false });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/', deferredPatch.promise);

    const { rerender } = render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Scheduling />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    await userTypeDatePicker(
      startingAt,
      screen.getByText(/Starting date/i),
      userEvent,
    );

    deferredPatch.resolve({ message: 'Classroom scheduled.' });

    // using userEvent.type with following input doesn't work
    const inputStartingAtTime = await screen.findByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, {
      target: { value: startingAt.toLocaleString(DateTime.TIME_24_SIMPLE) },
    });
    fireEvent.blur(inputStartingAtTime);

    // simulate classroom update
    classroom = {
      ...classroom,
      title: 'updated title',
      starting_at: startingAt.toISO(),
    };
    rerender(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Scheduling />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);

    // issue with useFakeTimers: https://github.com/testing-library/user-event/issues/833
    const user = userEvent.setup({ delay: null });

    await user.type(inputEstimatedDuration, estimatedDuration.toFormat('h:mm'));
    fireEvent.blur(inputEstimatedDuration);

    // simulate classroom update

    classroom = {
      ...classroom,
      title: 'updated title',
      starting_at: startingAt.toISO(),
      estimated_duration: estimatedDuration.toFormat('hh:mm:ss'),
    };
    rerender(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Scheduling />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    deferredPatch.resolve({ message: 'Classroom scheduled.' });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));

    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        starting_at: startingAt.toISO(),
      }),
    });

    expect(fetchMock.calls()[1]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[1]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        estimated_duration: estimatedDuration.toFormat('hh:mm:ss'),
      }),
    });
  });
});

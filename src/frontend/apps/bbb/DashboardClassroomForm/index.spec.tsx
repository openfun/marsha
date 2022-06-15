import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { Deferred } from 'utils/tests/Deferred';

import { classroomMockFactory } from 'apps/bbb/utils/tests/factories';
import DashboardClassroomForm from './index';

let matchMedia: MatchMediaMock;

jest.mock('data/appData', () => ({
  appData: {
    modelName: 'classrooms',
    resource: {
      id: '1',
    },
    static: {
      img: {
        bbbBackground: 'some_url',
      },
    },
  },
}));

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';
const currentDate = DateTime.local(2022, 1, 27, 14, 22, 15);

describe('<DashboardClassroomForm />', () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(currentDate.toJSDate());
  });
  afterEach(() => {
    matchMedia.clear();
    jest.resetAllMocks();
    fetchMock.restore();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('creates a classroom with current values', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    const { getByText, findByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <DashboardClassroomForm classroom={classroom} />
        </QueryClientProvider>,
      ),
    );
    getByText('Title');
    getByText('Welcome text');

    fireEvent.click(screen.getByText('Launch the classroom now in BBB'));
    await act(async () =>
      deferredPatch.resolve({ message: 'Classroom created.' }),
    );
    await findByText('Classroom created.');

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/create/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(classroom),
    });
  });

  it('creates a classroom with updated values', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    const { getByText, rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm classroom={classroom} />
        </QueryClientProvider>,
      ),
    );
    getByText('Title');
    getByText('Welcome text');

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.clear(inputTitle);
    userEvent.type(inputTitle, 'updated title');
    fireEvent.blur(inputTitle);

    // simulate updated classroom
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm
            classroom={{
              ...classroom,
              title: 'updated title',
            }}
          />
        </QueryClientProvider>,
      ),
    );

    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });
    userEvent.type(inputWelcomeText, 'updated welcome text', {
      initialSelectionStart: 0,
      initialSelectionEnd: classroom.welcome_text.length,
    });

    // wait for debounce to update the classroom
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      title: 'updated title',
      welcomeText: 'updated welcome text',
    });
    jest.runAllTimers();

    // simulate updated classroom
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm
            classroom={{
              ...classroom,
              title: 'updated title',
              welcome_text: 'updated welcome text',
            }}
          />
        </QueryClientProvider>,
      ),
    );

    fireEvent.click(screen.getByText('Launch the classroom now in BBB'));
    await act(async () =>
      deferredPatch.resolve({ message: 'Classroom created.' }),
    );

    expect(fetchMock.calls()).toHaveLength(3);

    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });

    expect(fetchMock.calls()[1]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[1]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        welcome_text: 'updated welcome text',
      }),
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/classrooms/1/create/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        ...classroom,
        title: 'updated title',
        welcome_text: 'updated welcome text',
      }),
    });
  });

  it('schedules a classroom', async () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const classroom = classroomMockFactory({ id: '1', started: false });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/', deferredPatch.promise);

    const { getByText, rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm classroom={classroom} />
        </QueryClientProvider>,
      ),
    );
    getByText('Title');
    getByText('Welcome text');

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.clear(inputTitle);
    userEvent.type(inputTitle, 'updated title');
    fireEvent.blur(inputTitle);

    // simulate classroom update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm
            classroom={{ ...classroom, title: 'updated title' }}
          />
        </QueryClientProvider>,
      ),
    );

    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });
    userEvent.type(inputWelcomeText, 'updated welcome text', {
      initialSelectionStart: 0,
      initialSelectionEnd: classroom.welcome_text.length,
    });
    fireEvent.blur(inputWelcomeText);

    jest.runAllTimers();
    await act(async () =>
      deferredPatch.resolve({ message: 'Classroom scheduled.' }),
    );

    expect(fetchMock.calls()).toHaveLength(2);

    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });

    expect(fetchMock.calls()[1]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[1]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        welcome_text: 'updated welcome text',
      }),
    });

    // simulate classroom update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm
            classroom={{
              ...classroom,
              title: 'updated title',
              welcome_text: 'updated welcome text',
            }}
          />
        </QueryClientProvider>,
      ),
    );

    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    userEvent.type(inputStartingAtDate, startingAt.toFormat('yyyy/MM/dd'));
    fireEvent.blur(inputStartingAtDate);
    await act(async () =>
      deferredPatch.resolve({ message: 'Classroom scheduled.' }),
    );

    // using userEvent.type with following input doesn't work
    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, {
      target: { value: startingAt.toLocaleString(DateTime.TIME_24_SIMPLE) },
    });
    fireEvent.blur(inputStartingAtTime);

    // simulate classroom update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm
            classroom={{
              ...classroom,
              title: 'updated title',
              starting_at: startingAt.toISO(),
            }}
          />
        </QueryClientProvider>,
      ),
    );

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    userEvent.type(inputEstimatedDuration, estimatedDuration.toFormat('h:mm'));
    fireEvent.blur(inputEstimatedDuration);

    // simulate classroom update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm
            classroom={{
              ...classroom,
              title: 'updated title',
              starting_at: startingAt.toISO(),
              estimated_duration: estimatedDuration.toFormat('hh:mm:ss'),
            }}
          />
        </QueryClientProvider>,
      ),
    );

    await act(async () =>
      deferredPatch.resolve({ message: 'Classroom scheduled.' }),
    );

    expect(fetchMock.calls()).toHaveLength(4);

    expect(fetchMock.calls()[2]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[2]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        starting_at: startingAt.toISO(),
      }),
    });

    expect(fetchMock.calls()[3]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[3]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        estimated_duration: estimatedDuration.toFormat('hh:mm:ss'),
      }),
    });
  });

  it('updates a classroom scheduled', async () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      starting_at: startingAt.toISO(),
      estimated_duration: estimatedDuration.toFormat('hh:mm:ss'),
    });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/', deferredPatch.promise);

    const { getByText, rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm classroom={classroom} />
        </QueryClientProvider>,
      ),
    );
    getByText('Title');
    getByText('Welcome text');

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.clear(inputTitle);
    userEvent.type(inputTitle, 'updated title');

    // Blur event should trigger update
    fireEvent.blur(inputTitle);
    await act(async () =>
      deferredPatch.resolve({ message: 'Classroom scheduled.' }),
    );

    // simulate classroom update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm
            classroom={{ ...classroom, title: 'updated title' }}
          />
        </QueryClientProvider>,
      ),
    );

    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });
    userEvent.type(inputWelcomeText, 'updated welcome text', {
      initialSelectionStart: 0,
      initialSelectionEnd: classroom.welcome_text?.length,
    });

    jest.runAllTimers();
    await act(async () =>
      deferredPatch.resolve({ message: 'Classroom scheduled.' }),
    );

    expect(fetchMock.calls()).toHaveLength(2);

    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });

    expect(fetchMock.calls()[1]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[1]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        welcome_text: 'updated welcome text',
      }),
    });
  });

  it('clears a classroom scheduled', async () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      starting_at: startingAt.toISO(),
      estimated_duration: estimatedDuration.toFormat('hh:mm:ss'),
    });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/', deferredPatch.promise);

    const { getByText, rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm classroom={classroom} />
        </QueryClientProvider>,
      ),
    );
    getByText('Title');
    getByText('Welcome text');

    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    userEvent.clear(inputStartingAtDate);
    fireEvent.blur(inputStartingAtDate);

    // simulate classroom update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardClassroomForm
            classroom={{ ...classroom, starting_at: null }}
          />
        </QueryClientProvider>,
      ),
    );

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    userEvent.clear(inputEstimatedDuration);

    jest.runAllTimers();
    await act(async () =>
      deferredPatch.resolve({ message: 'Classroom scheduled.' }),
    );

    expect(fetchMock.calls()).toHaveLength(2);

    expect(fetchMock.calls()[0][0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[0][1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        starting_at: null,
      }),
    });

    expect(fetchMock.calls()[1][0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[1][1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        estimated_duration: null,
      }),
    });
  });

  it('shows an error when classroom title is missing', async () => {
    const classroom = classroomMockFactory({ title: null, id: '1' });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    const { getByText, queryByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <DashboardClassroomForm classroom={classroom} />
        </QueryClientProvider>,
      ),
    );

    // title empty, error message should be shown
    getByText('Title is required to launch the classroom.');
    const launchButton = getByText('Launch the classroom now in BBB');
    expect(launchButton).toBeDisabled();

    // title filled, error message should be hidden
    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.type(inputTitle, 'updated title');
    const titleError = queryByText(
      'Title is required to launch the classroom.',
    );
    expect(titleError).not.toBeInTheDocument();
  });
});

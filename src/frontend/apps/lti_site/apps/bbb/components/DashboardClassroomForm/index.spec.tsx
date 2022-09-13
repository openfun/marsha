import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';

import { classroomMockFactory } from 'apps/bbb/utils/tests/factories';
import { Deferred } from 'utils/tests/Deferred';
import render from 'utils/tests/render';

import DashboardClassroomForm from './index';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    modelName: 'classrooms',
    resource: {
      id: '1',
    },
    static: {
      img: {
        bbbBackground: 'some_url',
      },
    },
  }),
}));

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';
const currentDate = DateTime.local(2022, 1, 27, 14, 22, 15);

describe('<DashboardClassroomForm />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(currentDate.toJSDate());
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
    jest.useRealTimers();
  });

  it('creates a classroom with current values', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    render(<DashboardClassroomForm classroom={classroom} />);
    screen.getByText('Title');
    screen.getByText('Welcome text');

    await act(() => {
      fireEvent.click(screen.getByText('Launch the classroom now in BBB'));
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/create/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(classroom),
    });

    await act(async () =>
      deferredPatch.resolve({ message: 'Classroom created.' }),
    );

    await screen.findByText('Classroom created.');
  });

  it('creates a classroom with updated values', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    // wait for debounce to update the classroom
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      title: 'updated title',
      welcomeText: 'updated welcome text',
    });

    const { rerender } = render(
      <DashboardClassroomForm classroom={classroom} />,
    );
    screen.getByText('Title');
    screen.getByText('Welcome text');

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    await act(() => {
      userEvent.clear(inputTitle);
      userEvent.type(inputTitle, 'updated title');
      fireEvent.blur(inputTitle);
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));

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

    // simulate updated classroom
    rerender(
      <DashboardClassroomForm
        classroom={{
          ...classroom,
          title: 'updated title',
        }}
      />,
    );

    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });
    await act(() => {
      userEvent.type(inputWelcomeText, 'updated welcome text', {
        initialSelectionStart: 0,
        initialSelectionEnd: classroom.welcome_text.length,
      });
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));

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

    // simulate updated classroom
    rerender(
      <DashboardClassroomForm
        classroom={{
          ...classroom,
          title: 'updated title',
          welcome_text: 'updated welcome text',
        }}
      />,
    );

    fireEvent.click(screen.getByText('Launch the classroom now in BBB'));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(3));

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

    await act(async () =>
      deferredPatch.resolve({ message: 'Classroom created.' }),
    );

    await waitFor(() => screen.getByText('Classroom created.'));
  });

  it('schedules a classroom', async () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const classroom = classroomMockFactory({ id: '1', started: false });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/', deferredPatch.promise);

    const { rerender } = render(
      <DashboardClassroomForm classroom={classroom} />,
    );
    screen.getByText('Title');
    screen.getByText('Welcome text');

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.clear(inputTitle);
    userEvent.type(inputTitle, 'updated title');

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.calls()[0][0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[0][1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });

    // simulate classroom update
    rerender(
      <DashboardClassroomForm
        classroom={{ ...classroom, title: 'updated title' }}
      />,
    );

    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });
    userEvent.type(inputWelcomeText, 'updated welcome text', {
      initialSelectionStart: 0,
      initialSelectionEnd: classroom.welcome_text.length,
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));

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

    expect(screen.queryByText('Classroom updated.')).not.toBeInTheDocument();

    await act(async () =>
      deferredPatch.resolve({ message: 'Classroom scheduled.' }),
    );

    await waitFor(() =>
      expect(screen.getAllByText('Classroom updated.').length).toEqual(2),
    );

    // simulate classroom update
    rerender(
      <DashboardClassroomForm
        classroom={{
          ...classroom,
          title: 'updated title',
          welcome_text: 'updated welcome text',
        }}
      />,
    );

    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    userEvent.type(inputStartingAtDate, startingAt.toFormat('yyyy/MM/dd'));
    fireEvent.blur(inputStartingAtDate);

    // using userEvent.type with following input doesn't work
    const inputStartingAtTime = screen.getByLabelText(/starting time/i);

    await act(() => {
      fireEvent.change(inputStartingAtTime, {
        target: { value: startingAt.toLocaleString(DateTime.TIME_24_SIMPLE) },
      });
      fireEvent.blur(inputStartingAtTime);
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(3));

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

    // simulate classroom update
    rerender(
      <DashboardClassroomForm
        classroom={{
          ...classroom,
          title: 'updated title',
          starting_at: startingAt.toISO(),
        }}
      />,
    );

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    await act(() => {
      userEvent.type(
        inputEstimatedDuration,
        estimatedDuration.toFormat('h:mm'),
      );
      fireEvent.blur(inputEstimatedDuration);
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(4));

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

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/', deferredPatch.promise);

    const { rerender } = render(
      <DashboardClassroomForm classroom={classroom} />,
    );
    screen.getByText('Title');
    screen.getByText('Welcome text');

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.clear(inputTitle);
    userEvent.type(inputTitle, 'updated title');

    await act(() => {
      // Blur event should trigger update
      fireEvent.blur(inputTitle);
      deferredPatch.resolve({ message: 'Classroom scheduled.' });
    });

    await waitFor(() => screen.getByText('Classroom updated.'));
    expect(fetchMock.calls()).toHaveLength(1);
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

    // simulate classroom update
    rerender(
      <DashboardClassroomForm
        classroom={{ ...classroom, title: 'updated title' }}
      />,
    );

    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });
    userEvent.type(inputWelcomeText, 'updated welcome text', {
      initialSelectionStart: 0,
      initialSelectionEnd: classroom.welcome_text?.length,
    });

    await act(() => {
      deferredPatch.resolve({ message: 'Classroom scheduled.' });
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));

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

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/', deferredPatch.promise);

    const { rerender } = render(
      <DashboardClassroomForm classroom={classroom} />,
    );
    screen.getByText('Title');
    screen.getByText('Welcome text');

    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    await act(() => {
      userEvent.clear(inputStartingAtDate);
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
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

    // simulate classroom update
    rerender(
      <DashboardClassroomForm
        classroom={{ ...classroom, starting_at: null }}
      />,
    );

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    await act(() => userEvent.clear(inputEstimatedDuration));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));
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

    expect(screen.queryByText('Classroom updated.')).not.toBeInTheDocument();

    await act(async () => {
      deferredPatch.resolve({ message: 'Classroom scheduled.' });
    });

    await waitFor(() =>
      expect(screen.getAllByText('Classroom updated.').length).toEqual(2),
    );
  });

  it('shows an error when classroom title is missing', async () => {
    const classroom = classroomMockFactory({ title: null, id: '1' });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    const { getByText, queryByText } = render(
      <DashboardClassroomForm classroom={classroom} />,
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

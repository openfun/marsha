import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render, Deferred } from 'lib-tests';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';

import {
  classroomMockFactory,
  classroomRecordingMockFactory,
} from '@lib-classroom/utils/tests/factories';

import { ClassroomForm } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
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

jest.mock('components/UploadDocuments', () => ({
  UploadDocuments: () => <p>Upload Documents.</p>,
}));

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';

describe('<ClassroomForm />', () => {
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

  it('creates a classroom with updated values', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    const { rerender } = render(<ClassroomForm classroom={classroom} />);
    screen.getByText('Title');
    screen.getByText('Welcome text');

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.clear(inputTitle);
    userEvent.type(inputTitle, 'updated title');
    fireEvent.blur(inputTitle);

    // simulate updated classroom
    rerender(
      <ClassroomForm
        classroom={{
          ...classroom,
          title: 'updated title',
        }}
      />,
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
      <ClassroomForm
        classroom={{
          ...classroom,
          title: 'updated title',
          welcome_text: 'updated welcome text',
        }}
      />,
    );

    deferredPatch.resolve({ message: 'Classroom updated.' });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));

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

  it('schedules a classroom', async () => {
    const startingAt = DateTime.local()
      .plus({ days: 1 })
      .set({ second: 0, millisecond: 0 });
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const classroom = classroomMockFactory({ id: '1', started: false });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/', deferredPatch.promise);

    const { rerender } = render(<ClassroomForm classroom={classroom} />);
    screen.getByText('Title');
    screen.getByText('Welcome text');

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.clear(inputTitle);
    userEvent.type(inputTitle, 'updated title');
    fireEvent.blur(inputTitle);

    // simulate classroom update
    rerender(
      <ClassroomForm classroom={{ ...classroom, title: 'updated title' }} />,
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

    deferredPatch.resolve({ message: 'Classroom scheduled.' });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));

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
      <ClassroomForm
        classroom={{
          ...classroom,
          title: 'updated title',
          welcome_text: 'updated welcome text',
        }}
      />,
    );

    // using userEvent.type with following input doesn't work
    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    fireEvent.change(inputStartingAtDate, {
      target: { value: startingAt.toFormat('yyyy/MM/dd') },
    });
    fireEvent.blur(inputStartingAtDate);
    deferredPatch.resolve({ message: 'Classroom scheduled.' });

    // using userEvent.type with following input doesn't work
    const inputStartingAtTime = await screen.findByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, {
      target: { value: startingAt.toLocaleString(DateTime.TIME_24_SIMPLE) },
    });
    fireEvent.blur(inputStartingAtTime);

    // simulate classroom update
    rerender(
      <ClassroomForm
        classroom={{
          ...classroom,
          title: 'updated title',
          starting_at: startingAt.toISO(),
        }}
      />,
    );

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    userEvent.type(inputEstimatedDuration, estimatedDuration.toFormat('h:mm'));
    fireEvent.blur(inputEstimatedDuration);

    // simulate classroom update
    rerender(
      <ClassroomForm
        classroom={{
          ...classroom,
          title: 'updated title',
          starting_at: startingAt.toISO(),
          estimated_duration: estimatedDuration.toFormat('hh:mm:ss'),
        }}
      />,
    );

    deferredPatch.resolve({ message: 'Classroom scheduled.' });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(4));

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
    const startingAt = DateTime.local()
      .plus({ days: 2, hours: 2 })
      .set({ second: 0, millisecond: 0 })
      .startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      starting_at: startingAt.toISO(),
      estimated_duration: estimatedDuration.toFormat('hh:mm:ss'),
    });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/', deferredPatch.promise);

    const { rerender } = render(<ClassroomForm classroom={classroom} />);
    screen.getByText('Title');
    screen.getByText('Welcome text');

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.clear(inputTitle);
    userEvent.type(inputTitle, 'updated title');

    // Blur event should trigger update
    fireEvent.blur(inputTitle);
    act(() => deferredPatch.resolve({ message: 'Classroom scheduled.' }));

    // simulate classroom update
    rerender(
      <ClassroomForm classroom={{ ...classroom, title: 'updated title' }} />,
    );

    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });
    userEvent.type(inputWelcomeText, 'updated welcome text', {
      initialSelectionStart: 0,
      initialSelectionEnd: classroom.welcome_text?.length,
    });

    jest.runAllTimers();

    act(() => {
      deferredPatch.resolve({ message: 'Classroom scheduled.' });
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));

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
    const startingAt = DateTime.local()
      .plus({ days: 2, hours: 2 })
      .set({ second: 0, millisecond: 0 })
      .startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      starting_at: startingAt.toISO(),
      estimated_duration: estimatedDuration.toFormat('hh:mm:ss'),
    });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/', deferredPatch.promise);

    const { rerender } = render(<ClassroomForm classroom={classroom} />);
    screen.getByText('Title');
    screen.getByText('Welcome text');

    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    userEvent.clear(inputStartingAtDate);
    fireEvent.blur(inputStartingAtDate);

    // simulate classroom update
    rerender(<ClassroomForm classroom={{ ...classroom, starting_at: null }} />);

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    userEvent.clear(inputEstimatedDuration);

    jest.runAllTimers();

    deferredPatch.resolve({ message: 'Classroom scheduled.' });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));

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

  it('shows an error when classroom title is missing', () => {
    const classroom = classroomMockFactory({ title: null, id: '1' });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    render(<ClassroomForm classroom={classroom} />);

    // title empty, error message should be shown
    screen.getByText('Title is required to launch the classroom.');

    // title filled, error message should be hidden
    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.type(inputTitle, 'updated title');
    const titleError = screen.queryByText(
      'Title is required to launch the classroom.',
    );
    expect(titleError).not.toBeInTheDocument();
  });

  it('displays invite and lti link', () => {
    const classroom = classroomMockFactory({
      title: null,
      id: '1',
      invite_token: 'my-token',
    });
    render(<ClassroomForm classroom={classroom} />);

    expect(
      screen.getByText('Invite someone with this link:'),
    ).toBeInTheDocument();
    expect(screen.getByText(/invite\/my-token/i)).toBeInTheDocument();

    expect(
      screen.getByText('LTI link for this classroom:'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('https://localhost/lti/classrooms/1'),
    ).toBeInTheDocument();
  });

  it('displays a list of available recordings', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    const classroomRecordings = [
      classroomRecordingMockFactory({
        started_at: DateTime.fromJSDate(
          new Date(2022, 1, 29, 11, 0, 0),
        ).toISO(),
      }),
      classroomRecordingMockFactory({
        started_at: DateTime.fromJSDate(
          new Date(2022, 1, 15, 11, 0, 0),
        ).toISO(),
      }),
    ];

    const { rerender } = render(<ClassroomForm classroom={classroom} />);

    expect(screen.getByText('Recordings')).toBeInTheDocument();
    expect(screen.getByText('No recordings available')).toBeInTheDocument();

    // simulate updated classroom
    rerender(
      <ClassroomForm
        classroom={{
          ...classroom,
          recordings: classroomRecordings,
        }}
      />,
    );

    expect(
      screen.queryByText('No recordings available'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Tuesday, March 1, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Tuesday, February 15, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
  });
});

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

import { meetingMockFactory } from 'apps/bbb/utils/tests/factories';
import DashboardMeetingForm from './index';

let matchMedia: MatchMediaMock;

jest.mock('data/appData', () => ({
  appData: {
    modelName: 'meetings',
    resource: {
      id: '1',
    },
  },
}));

Settings.defaultLocale = 'en';
Settings.defaultZone = 'utc';
const currentDate = DateTime.local(2022, 1, 27, 14, 22, 15);

describe('<DashboardMeetingForm />', () => {
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

  it('creates a meeting with current values', async () => {
    const meeting = meetingMockFactory({ id: '1', started: false });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/meetings/1/create/', deferredPatch.promise);

    const { getByText, findByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <DashboardMeetingForm meeting={meeting} />
        </QueryClientProvider>,
      ),
    );
    getByText('Title');
    getByText('Welcome text');

    fireEvent.click(screen.getByText('Create meeting in BBB'));
    await act(async () =>
      deferredPatch.resolve({ message: 'Meeting created.' }),
    );
    await findByText('Meeting created.');

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.calls()[0]![0]).toEqual('/api/meetings/1/create/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(meeting),
    });
  });

  it('creates a meeting with updated values', async () => {
    const meeting = meetingMockFactory({ id: '1', started: false });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/meetings/1/create/', deferredPatch.promise);

    const { getByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeetingForm meeting={meeting} />
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

    // simulate updated meeting
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeetingForm
            meeting={{
              ...meeting,
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
      initialSelectionEnd: meeting.welcome_text.length,
    });

    // wait for debounce to update the meeting
    fetchMock.patch('/api/meetings/1/', {
      ...meeting,
      title: 'updated title',
      welcomeText: 'updated welcome text',
    });
    jest.runAllTimers();

    fireEvent.click(screen.getByText('Create meeting in BBB'));
    await act(async () =>
      deferredPatch.resolve({ message: 'Meeting created.' }),
    );

    expect(fetchMock.calls()).toHaveLength(3);

    expect(fetchMock.calls()[0]![0]).toEqual('/api/meetings/1/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });

    expect(fetchMock.calls()[1]![0]).toEqual('/api/meetings/1/');
    expect(fetchMock.calls()[1]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        welcome_text: 'updated welcome text',
      }),
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/meetings/1/create/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        ...meeting,
        title: 'updated title',
        welcome_text: 'updated welcome text',
      }),
    });
  });

  it('schedules a meeting', async () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const meeting = meetingMockFactory({ id: '1', started: false });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/meetings/1/', deferredPatch.promise);

    const { getByText, rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeetingForm meeting={meeting} />
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

    // simulate meeting update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeetingForm
            meeting={{ ...meeting, title: 'updated title' }}
          />
        </QueryClientProvider>,
      ),
    );

    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });
    userEvent.type(inputWelcomeText, 'updated welcome text', {
      initialSelectionStart: 0,
      initialSelectionEnd: meeting.welcome_text.length,
    });
    fireEvent.blur(inputWelcomeText);

    jest.runAllTimers();
    await act(async () =>
      deferredPatch.resolve({ message: 'Meeting scheduled.' }),
    );

    expect(fetchMock.calls()).toHaveLength(2);

    expect(fetchMock.calls()[0]![0]).toEqual('/api/meetings/1/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });

    expect(fetchMock.calls()[1]![0]).toEqual('/api/meetings/1/');
    expect(fetchMock.calls()[1]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        welcome_text: 'updated welcome text',
      }),
    });

    // simulate meeting update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeetingForm
            meeting={{
              ...meeting,
              title: 'updated title',
              welcome_text: 'updated welcome text',
            }}
          />
        </QueryClientProvider>,
      ),
    );

    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    fireEvent.change(inputStartingAtDate, {
      target: { value: startingAt.toFormat('dd/MM/yyyy') },
    });

    // using userEvent.type with following input doesn't work
    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, {
      target: { value: startingAt.toLocaleString(DateTime.TIME_24_SIMPLE) },
    });
    fireEvent.blur(inputStartingAtTime);

    // simulate meeting update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeetingForm
            meeting={{
              ...meeting,
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

    // simulate meeting update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeetingForm
            meeting={{
              ...meeting,
              title: 'updated title',
              starting_at: startingAt.toISO(),
              estimated_duration: estimatedDuration.toFormat('hh:mm:ss'),
            }}
          />
        </QueryClientProvider>,
      ),
    );

    await act(async () =>
      deferredPatch.resolve({ message: 'Meeting scheduled.' }),
    );

    expect(fetchMock.calls()).toHaveLength(4);

    expect(fetchMock.calls()[2]![0]).toEqual('/api/meetings/1/');
    expect(fetchMock.calls()[2]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        starting_at: startingAt.toISO(),
      }),
    });

    expect(fetchMock.calls()[3]![0]).toEqual('/api/meetings/1/');
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

  it('updates a meeting scheduled', async () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const meeting = meetingMockFactory({
      id: '1',
      started: false,
      starting_at: startingAt.toISO(),
      estimated_duration: estimatedDuration.toFormat('hh:mm:ss'),
    });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/meetings/1/', deferredPatch.promise);

    const { getByText, rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeetingForm meeting={meeting} />
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

    jest.runAllTimers();
    await act(async () =>
      deferredPatch.resolve({ message: 'Meeting scheduled.' }),
    );

    // simulate meeting update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeetingForm
            meeting={{ ...meeting, title: 'updated title' }}
          />
        </QueryClientProvider>,
      ),
    );

    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });
    userEvent.type(inputWelcomeText, 'updated welcome text', {
      initialSelectionStart: 0,
      initialSelectionEnd: meeting.welcome_text?.length,
    });

    jest.runAllTimers();
    await act(async () =>
      deferredPatch.resolve({ message: 'Meeting scheduled.' }),
    );

    expect(fetchMock.calls()).toHaveLength(2);

    expect(fetchMock.calls()[0]![0]).toEqual('/api/meetings/1/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });

    expect(fetchMock.calls()[1]![0]).toEqual('/api/meetings/1/');
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
});

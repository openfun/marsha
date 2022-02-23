import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { Deferred } from 'utils/tests/Deferred';

import { meetingMockFactory } from 'apps/bbb/utils/tests/factories';
import DashboardMeeting from '.';

let mockCanUpdate: boolean;
let mockUserFullname: string | undefined;
jest.mock('data/appData', () => ({
  appData: {
    modelName: 'meetings',
    resource: {
      id: '1',
    },
  },
  getDecodedJwt: () => ({
    permissions: {
      can_update: mockCanUpdate,
    },
    consumer_site: 'consumer_site',
    user: {
      id: 'user_id',
      user_fullname: mockUserFullname,
    },
  }),
}));

jest.mock('apps/bbb/data/bbbAppData', () => ({
  bbbAppData: {
    modelName: 'meetings',
    meeting: {
      id: '1',
    },
  },
}));

describe('<DashboardMeeting />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('shows student dashboard', async () => {
    mockCanUpdate = false;
    const meeting = meetingMockFactory({
      id: '1',
      started: false,
      ended: false,
    });
    const queryClient = new QueryClient();
    const meetingDeferred = new Deferred();
    fetchMock.get('/api/meetings/1/', meetingDeferred.promise);

    const { getByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeeting />
        </QueryClientProvider>,
      ),
    );
    getByText('Loading meeting...');
    await act(async () => meetingDeferred.resolve(meeting));
    getByText('Meeting not started yet.');
  });

  it('shows instructor dashboard', async () => {
    mockCanUpdate = true;
    const meeting = meetingMockFactory({
      id: '1',
      started: false,
      ended: false,
    });
    const queryClient = new QueryClient();
    const meetingDeferred = new Deferred();
    fetchMock.get('/api/meetings/1/', meetingDeferred.promise);

    const { findByText, getByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeeting />
        </QueryClientProvider>,
      ),
    );
    getByText('Loading meeting...');
    await act(async () => meetingDeferred.resolve(meeting));
    await findByText('Create meeting in BBB');
  });

  it('asks for fullname when joining a meeting, cancellable for instructor', async () => {
    mockCanUpdate = true;
    const meeting = meetingMockFactory({ id: '1', started: false });
    const queryClient = new QueryClient();
    const meetingDeferred = new Deferred();
    fetchMock.get('/api/meetings/1/', meetingDeferred.promise);

    const { findByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeeting />
        </QueryClientProvider>,
      ),
    );
    await act(async () => meetingDeferred.resolve(meeting));

    const createdMeeting = {
      ...meeting,
      started: true,
    };
    fetchMock.patch('/api/meetings/1/create/', createdMeeting);

    fetchMock.get('/api/meetings/1/', createdMeeting, {
      overwriteRoutes: true,
    });

    fireEvent.click(screen.getByText('Create meeting in BBB'));
    fireEvent.click(await findByText('Join meeting'));

    await findByText('Please enter your name to join the meeting');
    await findByText('Cancel');
  });

  it('asks for fullname when joining a meeting, not cancellable for student', async () => {
    mockCanUpdate = false;
    mockUserFullname = undefined;
    window.open = jest.fn(() => window);

    const meeting = meetingMockFactory({
      id: '1',
      started: true,
      ended: false,
    });
    const queryClient = new QueryClient();
    const meetingDeferred = new Deferred();
    fetchMock.get('/api/meetings/1/', meetingDeferred.promise);

    const { findByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeeting />
        </QueryClientProvider>,
      ),
    );
    await act(async () => meetingDeferred.resolve(meeting));
    fireEvent.click(screen.getByText('Join meeting'));
    await findByText('Please enter your name to join the meeting');
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();

    const inputUsername = screen.getByRole('textbox');
    fireEvent.change(inputUsername, { target: { value: 'Joe' } });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/meetings/1/join/', deferredPatch.promise);
    fireEvent.click(screen.getByText('Join'));
    await act(async () =>
      deferredPatch.resolve({ url: 'server.bbb/meeting/url' }),
    );
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it('uses appdata fullname when joining a meeting', async () => {
    mockCanUpdate = true;
    mockUserFullname = 'Full user name';
    window.open = jest.fn(() => window);

    const meeting = meetingMockFactory({ id: '1', started: true });
    const queryClient = new QueryClient();
    const meetingDeferred = new Deferred();
    fetchMock.get('/api/meetings/1/', meetingDeferred.promise);

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/meetings/1/join/', deferredPatch.promise);

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeeting />
        </QueryClientProvider>,
      ),
    );
    await act(async () => meetingDeferred.resolve(meeting));
    fireEvent.click(screen.getByText('Join meeting'));
    await act(async () =>
      deferredPatch.resolve({ url: 'server.bbb/meeting/url' }),
    );

    expect(fetchMock.calls()[1]![0]).toEqual('/api/meetings/1/join/');
    expect(fetchMock.calls()[1]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        fullname: 'Full user name',
      }),
    });
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(
      'server.bbb/meeting/url',
      '_blank',
    );
    const urlMessage = screen.queryByText(
      'please click bbb url to join meeting',
    );
    expect(urlMessage).not.toBeInTheDocument();

    // multiple joining must be avoided
    fireEvent.click(screen.getByText('Join meeting'));
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it('displays user fullname when joining a meeting', async () => {
    mockCanUpdate = true;
    mockUserFullname = 'Full user name';
    window.open = jest.fn(() => null);

    const meeting = meetingMockFactory({ id: '1', started: false });
    const queryClient = new QueryClient();
    const meetingDeferred = new Deferred();
    fetchMock.get('/api/meetings/1/', meetingDeferred.promise);

    fetchMock.patch('/api/meetings/1/create/', {
      ...meeting,
      started: true,
    });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/meetings/1/join/', deferredPatch.promise);

    const { getByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeeting />
        </QueryClientProvider>,
      ),
    );
    await act(async () => meetingDeferred.resolve(meeting));
    await act(async () =>
      deferredPatch.resolve({ url: 'server.bbb/meeting/url' }),
    );

    const updatedMeetingDeferred = new Deferred();
    fetchMock.get('/api/meetings/1/', updatedMeetingDeferred.promise, {
      overwriteRoutes: true,
    });

    fireEvent.click(screen.getByText('Create meeting in BBB'));

    expect(fetchMock.lastCall()![0]).toEqual('/api/meetings/1/');
    const updatedMeeting = {
      ...meeting,
      started: true,
      infos: {
        attendees: [
          {
            userID: 'consumer_site_user_id',
            fullName: 'Full user name',
            hasVideo: 'true',
            hasJoinedVoice: 'true',
            isListeningOnly: 'false',
          },
        ],
      },
    };
    await act(async () => updatedMeetingDeferred.resolve(updatedMeeting));

    expect(fetchMock.lastCall()![0]).toEqual('/api/meetings/1/');
    getByText('You have joined the meeting as Full user name.');
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { Deferred } from 'utils/tests/Deferred';

import { meetingMockFactory } from 'apps/bbb/utils/tests/factories';
import { Meeting } from 'apps/bbb/types/models';
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
    user: {
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

jest.mock(
  'apps/bbb/DashboardMeetingStudent',
  () =>
    (props: {
      meeting: Meeting;
      joinMeetingAction: () => void;
      meetingEnded: () => void;
    }) => {
      return (
        <div>
          <p>student dashboard</p>
          <button onClick={props.joinMeetingAction}>join</button>
        </div>
      );
    },
);

jest.mock(
  'apps/bbb/DashboardMeetingInstructor',
  () =>
    (props: {
      meeting: Meeting;
      joinMeetingAction: () => void;
      meetingEnded: () => void;
    }) => {
      return (
        <div>
          <p>instructor dashboard</p>
          <button onClick={props.joinMeetingAction}>join</button>
        </div>
      );
    },
);

jest.mock(
  'apps/bbb/DashboardMeetingAskUsername',
  () => (props: { onCancel: undefined }) => {
    if (props.onCancel) {
      return <p>form ask fullname with cancel</p>;
    }
    return <p>form ask fullname without cancel</p>;
  },
);

jest.mock('apps/bbb/DashboardMeetingJoin', () => () => (
  <p>please click bbb url to join meeting</p>
));

describe('<DashboardMeeting />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('shows student dashboard', async () => {
    mockCanUpdate = false;
    const meeting = meetingMockFactory({ id: '1', started: false });
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
    getByText('student dashboard');
  });

  it('shows instructor dashboard', async () => {
    mockCanUpdate = true;
    const meeting = meetingMockFactory({ id: '1', started: false });
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
    getByText('instructor dashboard');
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
    fireEvent.click(screen.getByText('join'));
    await findByText('form ask fullname with cancel');
  });

  it('asks for fullname when joining a meeting, not cancellable for student', async () => {
    mockCanUpdate = false;
    mockUserFullname = undefined;
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
    fireEvent.click(screen.getByText('join'));
    await findByText('form ask fullname without cancel');
  });

  it('uses appdata fullname when joining a meeting', async () => {
    mockCanUpdate = true;
    mockUserFullname = 'Full user name';
    window.open = jest.fn(() => window);

    const meeting = meetingMockFactory({ id: '1', started: false });
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
    fireEvent.click(screen.getByText('join'));
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
    fireEvent.click(screen.getByText('join'));
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it('shows a link when joining a meeting if new tab is blocked', async () => {
    mockCanUpdate = true;
    mockUserFullname = 'Full user name';
    window.open = jest.fn(() => null);

    const meeting = meetingMockFactory({ id: '1', started: false });
    const queryClient = new QueryClient();
    const meetingDeferred = new Deferred();
    fetchMock.get('/api/meetings/1/', meetingDeferred.promise);

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

    fireEvent.click(screen.getByText('join'));

    expect(fetchMock.lastCall()![0]).toEqual('/api/meetings/1/');
    const updatedMeeting = {
      ...meeting,
      started: true,
    };
    await act(async () => updatedMeetingDeferred.resolve(updatedMeeting));

    getByText('instructor dashboard');
    getByText('please click bbb url to join meeting');
  });
});

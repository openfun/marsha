import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { getDecodedJwt } from 'data/appData';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { Deferred } from 'utils/tests/Deferred';
import {
  ltiInstructorTokenMockFactory,
  ltiStudentTokenMockFactory,
} from 'utils/tests/factories';

import { meetingMockFactory } from 'apps/bbb/utils/tests/factories';
import DashboardMeeting from '.';

jest.mock('data/appData', () => ({
  appData: {
    modelName: 'meetings',
    resource: {
      id: '1',
    },
    static: {
      img: {
        bbbBackground: 'some_url',
      },
    },
  },
  getDecodedJwt: jest.fn(),
}));

const mockGetDecodedJwt = getDecodedJwt as jest.MockedFunction<
  typeof getDecodedJwt
>;

jest.mock('apps/bbb/data/bbbAppData', () => ({
  bbbAppData: {
    modelName: 'meetings',
    meeting: {
      id: '1',
    },
    jwt: 'token',
  },
}));

describe('<DashboardMeeting />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('shows student dashboard', async () => {
    mockGetDecodedJwt.mockReturnValue(ltiStudentTokenMockFactory());
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
    mockGetDecodedJwt.mockReturnValue(ltiInstructorTokenMockFactory());
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
    await findByText('Launch the meeting now in BBB');
  });

  it('asks for fullname when joining a meeting, cancellable for instructor', async () => {
    const token = ltiInstructorTokenMockFactory(
      {},
      { user_fullname: undefined },
    );
    mockGetDecodedJwt.mockReturnValue(token);
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

    fireEvent.click(screen.getByText('Launch the meeting now in BBB'));
    fireEvent.click(await findByText('Join meeting'));

    await findByText('Please enter your name to join the meeting');
    await findByText('Cancel');
  });

  it('asks for fullname when joining a meeting, not cancellable for student', async () => {
    const token = ltiStudentTokenMockFactory({}, { user_fullname: undefined });
    mockGetDecodedJwt.mockReturnValue(token);
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
    fireEvent.click(screen.getByText('Click here to access meeting'));
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
    const token = ltiInstructorTokenMockFactory();
    mockGetDecodedJwt.mockReturnValue(token);
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
        fullname: token.user?.user_fullname,
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
    const token = ltiInstructorTokenMockFactory();
    mockGetDecodedJwt.mockReturnValue(token);
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

    fireEvent.click(screen.getByText('Launch the meeting now in BBB'));

    expect(fetchMock.lastCall()![0]).toEqual('/api/meetings/1/');
    const updatedMeeting = {
      ...meeting,
      started: true,
      infos: {
        attendees: [
          {
            userID: `${token.consumer_site}_${token.user?.id}`,
            fullName: token.user?.user_fullname,
            hasVideo: 'true',
            hasJoinedVoice: 'true',
            isListeningOnly: 'false',
          },
        ],
      },
    };
    await act(async () => updatedMeetingDeferred.resolve(updatedMeeting));

    expect(fetchMock.lastCall()![0]).toEqual('/api/meetings/1/');
    getByText(`You have joined the meeting as ${token.user?.user_fullname}.`);
  });

  it('display error when no jwt exists', async () => {
    mockGetDecodedJwt.mockImplementation(() => {
      throw new Error('No jwt');
    });
    const { getByText } = render(wrapInIntlProvider(<DashboardMeeting />));

    getByText('The meeting you are looking for could not be found');
    getByText(
      'This meeting does not exist or has not been published yet. If you are an instructor, please make sure you are properly authenticated.',
    );
  });

  it('shows an error message when it fails to get the meeting', async () => {
    mockGetDecodedJwt.mockReturnValue(ltiStudentTokenMockFactory());
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const meetingDeferred = new Deferred();
    fetchMock.get('/api/meetings/1/', meetingDeferred.promise);

    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

    const { getByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeeting />
        </QueryClientProvider>,
      ),
    );
    getByText('Loading meeting...');
    await act(async () => meetingDeferred.resolve(500));
    getByText('The meeting you are looking for could not be found');
    getByText(
      'This meeting does not exist or has not been published yet. If you are an instructor, please make sure you are properly authenticated.',
    );
  });
});

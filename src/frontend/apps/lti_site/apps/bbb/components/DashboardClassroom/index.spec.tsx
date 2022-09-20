import { act, fireEvent, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient } from 'react-query';

import { useJwt } from 'data/stores/useJwt';
import { Deferred } from 'utils/tests/Deferred';
import {
  ltiInstructorTokenMockFactory,
  ltiStudentTokenMockFactory,
} from 'utils/tests/factories';
import render from 'utils/tests/render';

import { classroomMockFactory } from 'apps/bbb/utils/tests/factories';

import DashboardClassroom from '.';

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

const mockGetDecodedJwt = jest.fn();

jest.mock('apps/bbb/data/bbbAppData', () => ({
  bbbAppData: {
    modelName: 'classrooms',
    classroom: {
      id: '1',
    },
  },
}));

describe('<DashboardClassroom />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
      getDecodedJwt: mockGetDecodedJwt,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('shows student dashboard', async () => {
    mockGetDecodedJwt.mockReturnValue(ltiStudentTokenMockFactory());
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      ended: false,
    });
    const classroomDeferred = new Deferred();
    fetchMock.get('/api/classrooms/1/', classroomDeferred.promise);

    const { getByText } = render(<DashboardClassroom />);

    getByText('Loading classroom...');
    await act(async () => classroomDeferred.resolve(classroom));
    getByText('Classroom not started yet.');
  });

  it('shows instructor dashboard', async () => {
    mockGetDecodedJwt.mockReturnValue(ltiInstructorTokenMockFactory());
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      ended: false,
    });
    const classroomDeferred = new Deferred();
    fetchMock.get('/api/classrooms/1/', classroomDeferred.promise);
    fetchMock.get('/api/classrooms/1/classroomdocuments/?limit=999', {
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const { findByText, getByText } = render(<DashboardClassroom />);
    getByText('Loading classroom...');
    await act(async () => classroomDeferred.resolve(classroom));
    await findByText('Launch the classroom now in BBB');
  });

  it('asks for fullname when joining a classroom, cancellable for instructor', async () => {
    const token = ltiInstructorTokenMockFactory(
      {},
      { user_fullname: undefined },
    );
    mockGetDecodedJwt.mockReturnValue(token);
    const classroom = classroomMockFactory({ id: '1', started: false });
    const classroomDeferred = new Deferred();
    fetchMock.get('/api/classrooms/1/', classroomDeferred.promise);
    fetchMock.get('/api/classrooms/1/classroomdocuments/?limit=999', {
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const { findByText } = render(<DashboardClassroom />);
    await act(async () => classroomDeferred.resolve(classroom));

    const createdClassroom = {
      ...classroom,
      started: true,
    };
    fetchMock.patch('/api/classrooms/1/create/', createdClassroom);

    fetchMock.get('/api/classrooms/1/', createdClassroom, {
      overwriteRoutes: true,
    });

    fireEvent.click(screen.getByText('Launch the classroom now in BBB'));
    fireEvent.click(await findByText('Join classroom'));

    await findByText('Please enter your name to join the classroom');
    await findByText('Cancel');
  });

  it('asks for fullname when joining a classroom, not cancellable for student', async () => {
    const token = ltiStudentTokenMockFactory({}, { user_fullname: undefined });
    mockGetDecodedJwt.mockReturnValue(token);
    window.open = jest.fn(() => window);

    const classroom = classroomMockFactory({
      id: '1',
      started: true,
      ended: false,
    });
    const classroomDeferred = new Deferred();
    fetchMock.get('/api/classrooms/1/', classroomDeferred.promise);
    fetchMock.get('/api/classrooms/1/classroomdocuments/?limit=999', {
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const { findByText } = render(<DashboardClassroom />);
    await act(async () => classroomDeferred.resolve(classroom));
    fireEvent.click(screen.getByText('Click here to access classroom'));
    await findByText('Please enter your name to join the classroom');
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();

    const inputUsername = screen.getByRole('textbox');
    fireEvent.change(inputUsername, { target: { value: 'Joe' } });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/join/', deferredPatch.promise);
    fireEvent.click(screen.getByText('Join'));
    await act(async () =>
      deferredPatch.resolve({ url: 'server.bbb/classroom/url' }),
    );
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it('uses appdata fullname when joining a classroom', async () => {
    const token = ltiInstructorTokenMockFactory();
    mockGetDecodedJwt.mockReturnValue(token);
    window.open = jest.fn(() => window);

    const classroom = classroomMockFactory({ id: '1', started: true });
    const classroomDeferred = new Deferred();
    fetchMock.get('/api/classrooms/1/', classroomDeferred.promise);
    fetchMock.get('/api/classrooms/1/classroomdocuments/?limit=999', {
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/join/', deferredPatch.promise);

    render(<DashboardClassroom />);
    await act(async () => classroomDeferred.resolve(classroom));
    fireEvent.click(screen.getByText('Join classroom'));
    await act(async () =>
      deferredPatch.resolve({ url: 'server.bbb/classroom/url' }),
    );

    expect(fetchMock.calls()[1]![0]).toEqual('/api/classrooms/1/join/');
    expect(fetchMock.calls()[1]![1]).toEqual({
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        fullname: token.user?.user_fullname,
      }),
    });
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(
      'server.bbb/classroom/url',
      '_blank',
    );
    const urlMessage = screen.queryByText(
      'please click bbb url to join classroom',
    );
    expect(urlMessage).not.toBeInTheDocument();

    // multiple joining must be avoided
    fireEvent.click(screen.getByText('Join classroom'));
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it('displays user fullname when joining a classroom', async () => {
    const token = ltiInstructorTokenMockFactory();
    mockGetDecodedJwt.mockReturnValue(token);
    window.open = jest.fn(() => null);

    const classroom = classroomMockFactory({ id: '1', started: false });
    const classroomDeferred = new Deferred();
    fetchMock.get('/api/classrooms/1/', classroomDeferred.promise);
    fetchMock.get('/api/classrooms/1/classroomdocuments/?limit=999', {
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    fetchMock.patch('/api/classrooms/1/create/', {
      ...classroom,
      started: true,
    });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/join/', deferredPatch.promise);

    const { getByText } = render(<DashboardClassroom />);
    await act(async () => classroomDeferred.resolve(classroom));
    await act(async () =>
      deferredPatch.resolve({ url: 'server.bbb/classroom/url' }),
    );

    const updatedClassroomDeferred = new Deferred();
    fetchMock.get('/api/classrooms/1/', updatedClassroomDeferred.promise, {
      overwriteRoutes: true,
    });

    fireEvent.click(screen.getByText('Launch the classroom now in BBB'));

    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/');
    const updatedClassroom = {
      ...classroom,
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
    await act(async () => updatedClassroomDeferred.resolve(updatedClassroom));

    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/');
    getByText(`You have joined the classroom as ${token.user?.user_fullname}.`);
  });

  it('display error when no jwt exists', async () => {
    mockGetDecodedJwt.mockImplementation(() => {
      throw new Error('No jwt');
    });
    const { getByText } = render(<DashboardClassroom />);

    getByText('The classroom you are looking for could not be found');
    getByText(
      'This classroom does not exist or has not been published yet. If you are an instructor, please make sure you are properly authenticated.',
    );
  });

  it('shows an error message when it fails to get the classroom', async () => {
    mockGetDecodedJwt.mockReturnValue(ltiStudentTokenMockFactory());
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const classroomDeferred = new Deferred();
    fetchMock.get('/api/classrooms/1/', classroomDeferred.promise);

    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

    const { getByText } = render(<DashboardClassroom />, {
      queryOptions: { client: queryClient },
    });
    getByText('Loading classroom...');
    await act(async () => classroomDeferred.resolve(500));
    getByText('The classroom you are looking for could not be found');
    getByText(
      'This classroom does not exist or has not been published yet. If you are an instructor, please make sure you are properly authenticated.',
    );
  });
});

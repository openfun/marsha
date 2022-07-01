import { screen } from '@testing-library/react';
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

import { fileDepositoryMockFactory } from 'apps/deposit/utils/tests/factories';
import DashboardFileDepository from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    modelName: 'file_depositories',
    resource: {
      id: '1',
    },
  }),
}));

const mockGetDecodedJwt = jest.fn();

jest.mock('apps/deposit/data/depositAppData', () => ({
  depositAppData: {
    modelName: 'file_depositories',
    fileDepository: {
      id: '1',
    },
    jwt: 'token',
  },
}));

jest.mock('./DashboardStudent', () => ({
  DashboardStudent: () => (
    <div>
      <p>FileDepository loaded.</p>
      <p>Student view</p>
    </div>
  ),
}));

jest.mock('./DashboardInstructor', () => ({
  DashboardInstructor: () => (
    <div>
      <p>FileDepository loaded.</p>
      <p>Instructor view</p>
    </div>
  ),
}));

describe('<DashboardFileDepository />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
      getDecodedJwt: mockGetDecodedJwt,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('shows student dashboard', async () => {
    mockGetDecodedJwt.mockReturnValue(ltiStudentTokenMockFactory());
    const fileDepository = fileDepositoryMockFactory({
      id: '1',
    });
    const fileDepositoryDeferred = new Deferred();
    fetchMock.get('/api/filedepositories/1/', fileDepositoryDeferred.promise);

    render(<DashboardFileDepository />);
    screen.getByText('Loading fileDepository...');
    fileDepositoryDeferred.resolve(fileDepository);
    await screen.findByText('FileDepository loaded.');
    screen.getByText('Student view');
  });

  it('shows instructor dashboard', async () => {
    mockGetDecodedJwt.mockReturnValue(ltiInstructorTokenMockFactory());
    const fileDepository = fileDepositoryMockFactory({
      id: '1',
    });
    const fileDepositoryDeferred = new Deferred();
    fetchMock.get('/api/filedepositories/1/', fileDepositoryDeferred.promise);

    render(<DashboardFileDepository />);
    screen.getByText('Loading fileDepository...');
    fileDepositoryDeferred.resolve(fileDepository);
    await screen.findByText('FileDepository loaded.');
    screen.getByText('Instructor view');
  });

  it('display error when no jwt exists', async () => {
    mockGetDecodedJwt.mockImplementation(() => {
      throw new Error('No jwt');
    });
    render(<DashboardFileDepository />);

    screen.getByText('Token Error');
  });

  it('shows an error message when it fails to get the fileDepository', async () => {
    mockGetDecodedJwt.mockReturnValue(ltiStudentTokenMockFactory());
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const fileDepositoryDeferred = new Deferred();
    fetchMock.get('/api/filedepositories/1/', fileDepositoryDeferred.promise);

    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

    render(<DashboardFileDepository />, {
      queryOptions: { client: queryClient },
    });
    screen.getByText('Loading fileDepository...');
    fileDepositoryDeferred.resolve(500);
    await screen.findByText('FileDepository not loaded!');
  });
});

import { QueryClient } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useCurrentResourceContext, useJwt } from 'lib-components';
import {
  ltiInstructorTokenMockFactory,
  ltiStudentTokenMockFactory,
} from 'lib-components/tests';
import { Deferred, render } from 'lib-tests';
import React from 'react';

import { fileDepositoryMockFactory } from 'apps/deposit/utils/tests/factories';

import DashboardFileDepository from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'file_depositories',
    resource: {
      id: '1',
    },
  }),
  useCurrentResourceContext: jest.fn(),
}));

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
      <p>File depository loaded.</p>
      <p>Student view</p>
    </div>
  ),
}));

jest.mock('./DashboardInstructor', () => ({
  DashboardInstructor: () => (
    <div>
      <p>File depository loaded.</p>
      <p>Instructor view</p>
    </div>
  ),
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<DashboardFileDepository />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('shows student dashboard', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      ltiStudentTokenMockFactory(),
    ] as any);
    const fileDepository = fileDepositoryMockFactory({
      id: '1',
    });
    const fileDepositoryDeferred = new Deferred();
    fetchMock.get('/api/filedepositories/1/', fileDepositoryDeferred.promise);

    render(<DashboardFileDepository />);
    screen.getByLabelText('Loading file depository...');
    fileDepositoryDeferred.resolve(fileDepository);
    await screen.findByText('File depository loaded.');
    expect(screen.getByText('Student view')).toBeInTheDocument();
  });

  it('shows instructor dashboard', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      ltiInstructorTokenMockFactory(),
    ] as any);
    const fileDepository = fileDepositoryMockFactory({
      id: '1',
    });
    const fileDepositoryDeferred = new Deferred();
    fetchMock.get('/api/filedepositories/1/', fileDepositoryDeferred.promise);

    render(<DashboardFileDepository />);
    screen.getByLabelText('Loading file depository...');
    fileDepositoryDeferred.resolve(fileDepository);
    await screen.findByText('File depository loaded.');
    expect(screen.getByText('Instructor view')).toBeInTheDocument();
  });

  it('shows an error message when it fails to get the fileDepository', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      ltiStudentTokenMockFactory(),
    ] as any);
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
    screen.getByLabelText('Loading file depository...');
    fileDepositoryDeferred.resolve(500);
    expect(
      await screen.findByText('File depository not loaded!'),
    ).toBeInTheDocument();
  });
});

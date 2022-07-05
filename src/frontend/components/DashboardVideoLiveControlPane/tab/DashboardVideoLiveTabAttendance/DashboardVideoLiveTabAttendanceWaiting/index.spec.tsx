import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Deferred } from 'utils/tests/Deferred';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardVideoLiveTabAttendanceWaiting } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'json web token',
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  },
}));
jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

describe('<DashboardVideoLiveTabAttendanceWaiting />', () => {
  jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

  afterEach(() => fetchMock.restore());

  it('displays the default message when there is no attendance', async () => {
    const deferred = new Deferred();
    fetchMock.mock(
      '/api/livesessions/list_attendances/?limit=999',
      deferred.promise,
    );
    const queryClient = new QueryClient();
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardVideoLiveTabAttendanceWaiting />,
        </QueryClientProvider>,
      ),
    );

    await act(async () =>
      deferred.resolve({ count: 0, next: null, previous: null, results: [] }),
    );
    screen.getByText('The live has no participant yet');
  });
});

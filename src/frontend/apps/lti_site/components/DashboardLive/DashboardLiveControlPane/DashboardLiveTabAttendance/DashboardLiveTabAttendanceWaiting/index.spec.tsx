import { screen } from '@testing-library/react';
import { useJwt } from 'lib-components';
import { render, Deferred } from 'lib-tests';
import fetchMock from 'fetch-mock';
import React from 'react';

import { DashboardLiveTabAttendanceWaiting } from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
}));

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<DashboardLiveTabAttendanceWaiting />', () => {
  jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => fetchMock.restore());

  it('displays the default message when there is no attendance', async () => {
    const deferred = new Deferred();
    fetchMock.mock(
      '/api/livesessions/list_attendances/?limit=999',
      deferred.promise,
    );

    render(<DashboardLiveTabAttendanceWaiting />);

    deferred.resolve({ count: 0, next: null, previous: null, results: [] });

    await screen.findByText('The live has no participant yet');
  });
});

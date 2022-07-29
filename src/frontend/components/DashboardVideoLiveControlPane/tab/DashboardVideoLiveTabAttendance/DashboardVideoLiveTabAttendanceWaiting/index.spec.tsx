import { screen } from '@testing-library/react';
import { useJwt } from 'data/stores/useJwt';
import fetchMock from 'fetch-mock';
import React from 'react';

import { Deferred } from 'utils/tests/Deferred';
import render from 'utils/tests/render';

import { DashboardVideoLiveTabAttendanceWaiting } from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

describe('<DashboardVideoLiveTabAttendanceWaiting />', () => {
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

    render(<DashboardVideoLiveTabAttendanceWaiting />);

    deferred.resolve({ count: 0, next: null, previous: null, results: [] });

    await screen.findByText('The live has no participant yet');
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { liveAttendanceFactory, useJwt } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';
import { setLogger } from 'react-query';

import { useLiveAttendances } from '.';

setLogger({
  log: console.log,
  warn: console.warn,
  // no more errors on the console
  error: () => {},
});

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('useLiveAttendances', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('requests the resource list', async () => {
    const liveAttendances = liveAttendanceFactory({
      live_attendance: {
        [Date.now()]: {
          fullScreen: true,
        },
      },
    });
    fetchMock.mock(
      '/api/videos/some-video-id/livesessions/list_attendances/?limit=999',
      liveAttendances,
    );

    const { result } = renderHook(() => useLiveAttendances('some-video-id'), {
      wrapper: WrapperReactQuery,
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      '/api/videos/some-video-id/livesessions/list_attendances/?limit=999',
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(result.current.data).toEqual(liveAttendances);
    expect(result.current.status).toEqual('success');
  });

  it('fails to get the resource list', async () => {
    fetchMock.mock(
      '/api/videos/some-video-id/livesessions/list_attendances/?limit=999',
      404,
    );

    const { result } = renderHook(() => useLiveAttendances('some-video-id'), {
      wrapper: WrapperReactQuery,
    });

    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      '/api/videos/some-video-id/livesessions/list_attendances/?limit=999',
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});

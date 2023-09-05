import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { WrapperReactQuery } from 'lib-tests';

import { useConfig } from '.';

describe('useConfig', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('successfully calls the API', async () => {
    fetchMock.getOnce('/api/config/', {
      sentry_dsn: 'https://sentry.io/1234567',
      environment: 'test',
      release: '1.0.0',
      inactive_resources: ['test'],
    });

    const { result } = renderHook(() => useConfig(), {
      wrapper: WrapperReactQuery,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(`/api/config/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
    });
    expect(result.current.data).toEqual({
      sentry_dsn: 'https://sentry.io/1234567',
      environment: 'test',
      release: '1.0.0',
      inactive_resources: ['test'],
    });
    expect(result.current.status).toEqual('success');
  });

  it('manages failure', async () => {
    fetchMock.getOnce('/api/config/', 401);

    const { result } = renderHook(() => useConfig(), {
      wrapper: WrapperReactQuery,
    });

    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/config/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Accept-Language': 'en',
        'Content-Type': 'application/json',
      },
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
    expect(result.current.error?.message).toEqual('Failed to get the configs.');
  });
});

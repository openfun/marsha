import { renderHook } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { WrapperReactQuery } from 'lib-tests';
import { setLogger } from 'react-query';

import { useConfig } from '.';

describe('useConfig', () => {
  beforeAll(() => {
    setLogger({
      log: console.log,
      warn: console.warn,
      // disable the "invalid json response body" error when testing failure
      error: jest.fn(),
    });
  });

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

    const { result, waitFor } = renderHook(() => useConfig(), {
      wrapper: WrapperReactQuery,
    });

    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/config/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
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

    const { result, waitFor } = renderHook(() => useConfig(), {
      wrapper: WrapperReactQuery,
    });

    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual('/api/config/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
    expect(result.current.error?.message).toEqual('Failed to get the configs.');
  });
});

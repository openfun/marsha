import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { WrapperReactQuery } from 'lib-tests';
import { setLogger } from '@tanstack/react-query';

import { usePagesApi } from './usePagesApi';

describe('usePagesApi', () => {
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
    fetchMock.getOnce('/api/pages/', {
      results: [
        {
          slug: 'test',
          name: 'Test',
          content: 'My test page',
        },
      ],
    });

    const { result } = renderHook(() => usePagesApi(), {
      wrapper: WrapperReactQuery,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual(`/api/pages/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });
    expect(result.current.data).toEqual({
      results: [
        {
          slug: 'test',
          name: 'Test',
          content: 'My test page',
        },
      ],
    });
    expect(result.current.status).toEqual('success');
  });

  it('manages failure', async () => {
    fetchMock.getOnce('/api/pages/', 401);

    const { result } = renderHook(() => usePagesApi(), {
      wrapper: WrapperReactQuery,
    });

    await waitFor(() => {
      expect(result.current.isError).toBeTruthy();
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/pages/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
    expect(result.current.error?.message).toEqual(
      'Failed to get list of pages.',
    );
  });
});

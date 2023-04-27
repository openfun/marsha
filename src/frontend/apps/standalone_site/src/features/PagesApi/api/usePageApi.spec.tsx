import { renderHook } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { WrapperReactQuery } from 'lib-tests';
import { setLogger } from 'react-query';

import { usePageApi } from './usePageApi';

describe('usePageApi', () => {
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
    fetchMock.getOnce('/api/pages/test/', {
      slug: 'test',
      name: 'Test',
      content: 'My test page',
    });

    const { result, waitFor } = renderHook(() => usePageApi('test'), {
      wrapper: WrapperReactQuery,
    });

    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/pages/test/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result.current.data).toEqual({
      slug: 'test',
      name: 'Test',
      content: 'My test page',
    });
    expect(result.current.status).toEqual('success');
  });

  it('manages failure', async () => {
    fetchMock.getOnce('/api/pages/test/', 401);

    const { result, waitFor } = renderHook(() => usePageApi('test'), {
      wrapper: WrapperReactQuery,
    });

    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual('/api/pages/test/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
    expect(result.current.error?.message).toEqual(
      'Failed to get /api/pages/test/.',
    );
  });
});

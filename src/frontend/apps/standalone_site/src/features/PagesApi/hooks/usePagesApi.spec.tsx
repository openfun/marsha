import { renderHook } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { WrapperReactQuery } from 'lib-tests';
import { setLogger } from 'react-query';

import { usePagesApi } from './usePagesApi';

describe('hook/usePagesApi', () => {
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

  it('checks hooks values with a successfull API call', async () => {
    fetchMock.getOnce('/api/pages/', {
      results: [
        {
          slug: 'test',
          name: 'Test',
          content: 'My test page',
        },
        {
          slug: 'cgi',
          name: 'General Conditions',
          content: 'Bla bla bla',
        },
      ],
    });

    const { result, waitForNextUpdate } = renderHook(() => usePagesApi(), {
      wrapper: WrapperReactQuery,
    });

    await waitForNextUpdate();

    expect(fetchMock.lastCall()![0]).toEqual(`/api/pages/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    expect(result.current.pagesApi).toEqual([
      {
        slug: 'test',
        name: 'Test',
        content: 'My test page',
      },
      {
        slug: 'cgi',
        name: 'General Conditions',
        content: 'Bla bla bla',
      },
    ]);

    expect(result.current.routesPagesApi).toEqual(['/test', '/cgi']);
  });

  it('checks hooks values with a failed API call', async () => {
    fetchMock.getOnce('/api/pages/', 401);

    const { result, waitForNextUpdate } = renderHook(() => usePagesApi(), {
      wrapper: WrapperReactQuery,
    });

    await waitForNextUpdate();

    expect(fetchMock.lastCall()![0]).toEqual(`/api/pages/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    expect(result.current.pagesApi).toEqual([]);
    expect(result.current.routesPagesApi).toEqual([]);
  });
});

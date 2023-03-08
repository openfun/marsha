import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { useBasicLogin } from './index';

let Wrapper: WrapperComponent<Element>;

describe('features/Authentication/api/basicLogin', () => {
  beforeAll(() => {
    setLogger({
      log: console.log,
      warn: console.warn,
      // disable the "invalid json response body" error when testing failure
      error: jest.fn(),
    });
  });

  beforeEach(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    Wrapper = function Wrapper({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  describe('useBasicLogin', () => {
    it('successfully authenticate user', async () => {
      fetchMock.postOnce('/account/api/token/', {
        access: 'some access token',
        refresh: 'some refresh token',
      });

      const { result, waitFor } = renderHook(() => useBasicLogin(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        username: 'some_username',
        password: 'some_password',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(`/account/api/token/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          username: 'some_username',
          password: 'some_password',
        }),
      });
      expect(result.current.data).toEqual({
        access: 'some access token',
        refresh: 'some refresh token',
      });
      expect(result.current.status).toEqual('success');

      const jwt = useJwt.getState().getJwt();
      expect(jwt).toEqual('some access token');
    });

    it('fails does not authenticate user when request fails', async () => {
      fetchMock.postOnce('/account/api/token/', 401);

      const { result, waitFor } = renderHook(() => useBasicLogin(), {
        wrapper: Wrapper,
      });

      result.current.mutate({
        username: 'some_username',
        password: 'some_password',
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual('/account/api/token/');
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          username: 'some_username',
          password: 'some_password',
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });
});

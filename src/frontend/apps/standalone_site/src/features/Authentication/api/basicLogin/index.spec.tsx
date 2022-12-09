import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { validateChallenge } from '../validateChallenge';

import { useBasicLogin } from './index';

jest.mock('../validateChallenge', () => ({
  validateChallenge: jest.fn(),
}));
const mockValidateChallenge = validateChallenge as jest.MockedFunction<
  typeof validateChallenge
>;

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
      fetchMock.postOnce('/account/api/login/', {
        challenge_token: 'some challenge token',
      });
      mockValidateChallenge.mockResolvedValueOnce('some access token');

      const { result, waitFor } = renderHook(() => useBasicLogin(), {
        wrapper: Wrapper,
      });
      result.current.mutate({
        username: 'some_username',
        password: 'some_password',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(`/account/api/login/`);
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
        challenge_token: 'some challenge token',
      });
      expect(result.current.status).toEqual('success');

      expect(validateChallenge).toHaveBeenCalledWith('some challenge token');

      const jwt = useJwt.getState().jwt;
      expect(jwt).toEqual('some access token');
    });

    it('fails does not authenticate user when request fails', async () => {
      fetchMock.postOnce('/account/api/login/', 401);

      const { result, waitFor } = renderHook(() => useBasicLogin(), {
        wrapper: Wrapper,
      });

      result.current.mutate({
        username: 'some_username',
        password: 'some_password',
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual('/account/api/login/');
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

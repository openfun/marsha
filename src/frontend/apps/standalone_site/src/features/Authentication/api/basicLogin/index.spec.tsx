import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';

import { useBasicLogin } from './index';

describe('features/Authentication/api/basicLogin', () => {
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

      const { result } = renderHook(() => useBasicLogin(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        username: 'some_username',
        password: 'some_password',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/account/api/token/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(() => useBasicLogin(), {
        wrapper: WrapperReactQuery,
      });

      result.current.mutate({
        username: 'some_username',
        password: 'some_password',
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual('/account/api/token/');
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { WrapperReactQuery } from 'lib-tests';
import { setLogger } from '@tanstack/react-query';

import { usePasswordResetConfirm } from './index';

describe('features/Authentication/api/usePasswordResetConfirm', () => {
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

  describe('usePasswordResetConfirm', () => {
    it('successfully calls the API', async () => {
      fetchMock.postOnce('/account/api/password/reset/confirm/', {
        details: 'Done',
      });

      const { result } = renderHook(() => usePasswordResetConfirm(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        uid: 'some_uid',
        token: 'some_token',
        new_password1: 'some_password',
        new_password2: 'some_password',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/account/api/password/reset/confirm/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          uid: 'some_uid',
          token: 'some_token',
          new_password1: 'some_password',
          new_password2: 'some_password',
        }),
      });
      expect(result.current.data).toEqual({
        details: 'Done',
      });
      expect(result.current.status).toEqual('success');
    });

    it('manages failure', async () => {
      fetchMock.postOnce('/account/api/password/reset/confirm/', 401);

      const { result } = renderHook(() => usePasswordResetConfirm(), {
        wrapper: WrapperReactQuery,
      });

      result.current.mutate({
        uid: 'some_uid',
        token: 'some_token',
        new_password1: 'some_password',
        new_password2: 'some_password',
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        '/account/api/password/reset/confirm/',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          uid: 'some_uid',
          token: 'some_token',
          new_password1: 'some_password',
          new_password2: 'some_password',
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });
});

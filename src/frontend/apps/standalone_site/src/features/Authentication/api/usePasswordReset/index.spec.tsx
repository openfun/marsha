import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { WrapperReactQuery } from 'lib-tests';

import { usePasswordReset } from './index';

describe('features/Authentication/api/usePasswordReset', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  describe('usePasswordReset', () => {
    it('successfully calls the API', async () => {
      fetchMock.postOnce('/account/api/password/reset/', {
        details: 'Email sent',
      });

      const { result } = renderHook(() => usePasswordReset(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        email: 'some_username',
        confirm_url: 'https://marsha.education/auth/password/reset/confirm/',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(`/account/api/password/reset/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
        method: 'POST',
        body: JSON.stringify({
          email: 'some_username',
          confirm_url: 'https://marsha.education/auth/password/reset/confirm/',
        }),
      });
      expect(result.current.data).toEqual({
        details: 'Email sent',
      });
      expect(result.current.status).toEqual('success');
    });

    it('manages failure', async () => {
      fetchMock.postOnce('/account/api/password/reset/', 401);

      const { result } = renderHook(() => usePasswordReset(), {
        wrapper: WrapperReactQuery,
      });

      result.current.mutate({
        email: 'some_username',
        confirm_url: 'https://marsha.education/auth/password/reset/confirm/',
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual('/account/api/password/reset/');
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
        method: 'POST',
        body: JSON.stringify({
          email: 'some_username',
          confirm_url: 'https://marsha.education/auth/password/reset/confirm/',
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });
});

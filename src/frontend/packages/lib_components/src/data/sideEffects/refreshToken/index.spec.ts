import fetchMock from 'fetch-mock';

import { useJwt } from '@lib-components/hooks';

import { refreshToken } from '.';

describe('refreshToken()', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('throws an error if request failed', async () => {
    fetchMock.post('/account/api/token/refresh/', 500);

    await expect(refreshToken('some_token')).rejects.toThrow(
      'refresh token error',
    );
  });

  it('throws an error if response has missing token', async () => {
    fetchMock.post('/account/api/token/refresh/', {
      access: 'some access token',
    });

    await expect(refreshToken('some_token')).rejects.toThrow(
      'Missing token in response.',
    );
  });

  it('returns the access token', async () => {
    fetchMock.post('/account/api/token/refresh/', {
      access: 'some access token',
      refresh: 'some refresh token',
    });

    expect(await refreshToken('some_token')).toEqual({
      access: 'some access token',
      refresh: 'some refresh token',
    });
  });

  it('blacklists the refresh token', async () => {
    fetchMock.post('/account/api/token/refresh/', {
      access: 'new access token',
      refresh: 'new refresh token',
    });

    await refreshToken('some refresh token');

    expect(useJwt.getState().refreshJwtBlackListed).toEqual(
      'some refresh token',
    );
  });

  it('throws an error if refresh token is blacklisted', async () => {
    useJwt.getState().setRefreshJwtBlackListed('some_token');

    fetchMock.post('/account/api/token/refresh/', {
      access: 'some access token',
      refresh: 'some refresh token',
    });

    await expect(refreshToken('some_token')).rejects.toThrow(
      'Refresh token is blacklisted',
    );
  });
});

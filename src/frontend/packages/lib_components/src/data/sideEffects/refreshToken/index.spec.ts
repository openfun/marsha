import fetchMock from 'fetch-mock';

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
});

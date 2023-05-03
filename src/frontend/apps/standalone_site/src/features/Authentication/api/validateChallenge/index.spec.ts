import fetchMock from 'fetch-mock';

import { validateChallenge } from '.';

describe('validateChallenge()', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('throws an error if request failed', async () => {
    fetchMock.post('/api/auth/challenge/', 500);

    await expect(validateChallenge('some_code')).rejects.toThrow(
      'Internal Server Error',
    );
  });

  it('throws an error if response is not an access token', async () => {
    const someStuff = {
      content: 'not an access token',
    };
    fetchMock.post('/api/auth/challenge/', someStuff);

    await expect(validateChallenge('some_code')).rejects.toThrow(
      'Missing access token in response.',
    );
  });

  it('returns the access token', async () => {
    const tokenPair = {
      access: 'some access token',
      refresh: 'some refresh token',
    };
    fetchMock.post('/api/auth/challenge/', tokenPair);

    expect(await validateChallenge('some_code')).toEqual(tokenPair);
  });
});

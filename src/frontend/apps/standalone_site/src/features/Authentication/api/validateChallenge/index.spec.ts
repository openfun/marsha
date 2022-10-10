import fetchMock from 'fetch-mock';

import { validateChallenge } from '.';

describe('validateChallenge()', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('throws an error if request failed', async () => {
    fetchMock.post('/api/auth/challenge/', 500);

    await expect(validateChallenge('some_code')).rejects.toThrow('failed');
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
    fetchMock.post('/api/auth/challenge/', { access: 'some access token' });

    expect(await validateChallenge('some_code')).toEqual('some access token');
  });
});

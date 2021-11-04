import fetchMock from 'fetch-mock';

import { createLiveRegistration } from '.';

jest.mock('../../appData', () => ({
  appData: {
    jwt: 'token',
  },
}));

describe('sideEffects/createLiveRegistration', () => {
  afterEach(() => fetchMock.restore());

  it('creates a new liveregistration and returns it', async () => {
    fetchMock.mock('/api/liveregistrations/', {
      id: '42',
      email: 'test@open-fun.fr',
    });

    const liveRegistration = await createLiveRegistration('test@open-fun.fr');

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(liveRegistration).toEqual({
      id: '42',
      email: 'test@open-fun.fr',
    });
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    });
    expect(fetchArgs.method).toEqual('POST');
  });

  it('throws when it fails to create a liveRegistration (request failure)', async () => {
    fetchMock.mock(
      '/api/liveregistrations/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(createLiveRegistration('email@fun.com')).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to create the liveRegistration (API error)', async () => {
    fetchMock.mock('/api/liveregistrations/', 400);

    await expect(createLiveRegistration('email@fun.com')).rejects.toThrowError(
      'Failed to create a new liveRegistration with email@fun.com: error 400.',
    );
  });
});

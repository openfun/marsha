import fetchMock from 'fetch-mock';

import { createLiveRegistration } from '.';

jest.mock('data/appData', () => ({
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

  it('throws when it fails to create the liveRegistration and returns a json Error', async () => {
    fetchMock.mock('/api/liveregistrations/', {
      body: JSON.stringify({ email: 'Invalid email!' }),
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    let thrownError;
    try {
      await createLiveRegistration('email@fun.com');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toEqual({
      code: 'invalid',
      email: 'Invalid email!',
    });
  });
});

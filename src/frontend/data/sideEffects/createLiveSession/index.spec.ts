import fetchMock from 'fetch-mock';
import { v4 as uuidv4 } from 'uuid';

import { createLiveSession } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'token',
  },
}));

describe('sideEffects/createLiveSession', () => {
  afterEach(() => fetchMock.restore());

  it('creates a new livesession and returns it', async () => {
    fetchMock.mock(
      {
        url: '/api/livesessions/',
        body: {
          email: 'test@open-fun.fr',
        },
        method: 'POST',
      },
      {
        id: '42',
        email: 'test@open-fun.fr',
      },
    );

    const liveSession = await createLiveSession('test@open-fun.fr');

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(liveSession).toEqual({
      id: '42',
      email: 'test@open-fun.fr',
    });
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    });
  });

  it('creates a new livesession with an anonymous id and returns it', async () => {
    const anonymousId = uuidv4();
    fetchMock.mock(
      {
        url: '/api/livesessions/',
        body: {
          anonymous_id: anonymousId,
          email: 'test@open-fun.fr',
        },
        method: 'POST',
      },
      {
        anonymous_id: anonymousId,
        id: '42',
        email: 'test@open-fun.fr',
      },
    );

    const liveSession = await createLiveSession(
      'test@open-fun.fr',
      anonymousId,
    );

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(liveSession).toEqual({
      anonymous_id: anonymousId,
      id: '42',
      email: 'test@open-fun.fr',
    });
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    });
  });

  it('throws when it fails to create the liveSession and returns a json Error', async () => {
    fetchMock.mock('/api/livesessions/', {
      body: JSON.stringify({ email: 'Invalid email!' }),
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    let thrownError;
    try {
      await createLiveSession(uuidv4(), 'email@fun.com');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toEqual({
      code: 'invalid',
      email: 'Invalid email!',
    });
  });
});

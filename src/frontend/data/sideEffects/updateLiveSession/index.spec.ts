import fetchMock from 'fetch-mock';
import { v4 as uuidv4 } from 'uuid';

import { liveSessionFactory } from 'utils/tests/factories';
import { updateLiveSession } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'token',
  },
}));

describe('updateLiveSession', () => {
  afterEach(() => fetchMock.restore());

  it('updates a live session and returns it', async () => {
    const liveSession = liveSessionFactory({
      email: 'john@fun-test.fr',
      is_registered: false,
    });

    fetchMock.mock(
      {
        url: `/api/livesessions/${liveSession.id}/`,
        body: {
          email: 'updated@fun-test.fr',
          is_registered: true,
        },
        method: 'PATCH',
      },
      {
        ...liveSession,
        email: 'updated@fun-test.fr',
        is_registered: true,
      },
    );

    const updatedLiveSession = await updateLiveSession(
      liveSession,
      'updated@fun-test.fr',
      true,
    );

    expect(updatedLiveSession.email).toEqual('updated@fun-test.fr');
    expect(updatedLiveSession.is_registered).toEqual(true);
  });

  it('updates a live session using an anonymoud_id and returns it', async () => {
    const anonymousId = uuidv4();
    const liveSession = liveSessionFactory({
      anonymous_id: anonymousId,
      email: 'john@fun-test.fr',
      is_registered: false,
    });

    fetchMock.mock(
      {
        url: `/api/livesessions/${liveSession.id}/?anonymous_id=${anonymousId}`,
        body: {
          email: 'updated@fun-test.fr',
          is_registered: true,
        },
        method: 'PATCH',
      },
      {
        ...liveSession,
        email: 'updated@fun-test.fr',
        is_registered: true,
      },
    );

    const updatedLiveSession = await updateLiveSession(
      liveSession,
      'updated@fun-test.fr',
      true,
      anonymousId,
    );

    expect(updatedLiveSession.email).toEqual('updated@fun-test.fr');
    expect(updatedLiveSession.is_registered).toEqual(true);
  });

  it('throws when it fails to update a live session and returns a json Error', async () => {
    const anonymousId = uuidv4();
    const liveSession = liveSessionFactory({
      anonymous_id: anonymousId,
      email: 'john@fun-test.fr',
      is_registered: false,
    });
    fetchMock.mock(
      `/api/livesessions/${liveSession.id}/?anonymous_id=${anonymousId}`,
      {
        body: JSON.stringify({ email: 'Invalid email!' }),
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );

    let thrownError;
    try {
      await updateLiveSession(liveSession, 'wrong email', true, anonymousId);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toEqual({
      code: 'invalid',
      email: 'Invalid email!',
    });
  });
});

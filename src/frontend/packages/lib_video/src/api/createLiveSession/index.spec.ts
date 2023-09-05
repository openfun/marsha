import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { v4 as uuidv4 } from 'uuid';

import { createLiveSession } from '.';

describe('sideEffects/createLiveSession', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
    });
  });

  afterEach(() => fetchMock.restore());

  it('creates a new livesession and returns it', async () => {
    fetchMock.mock(
      {
        url: '/api/videos/some-video-id/livesessions/',
        body: {
          email: 'test@open-fun.fr',
          language: 'fr',
        },
        method: 'POST',
      },
      {
        id: '42',
        email: 'test@open-fun.fr',
        language: 'fr',
      },
    );

    const liveSession = await createLiveSession(
      'some-video-id',
      'test@open-fun.fr',
      'fr',
    );

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(liveSession).toEqual({
      id: '42',
      email: 'test@open-fun.fr',
      language: 'fr',
    });
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
      'Accept-Language': 'en',
    });
  });

  it('creates a new livesession with an anonymous id and returns it', async () => {
    const anonymousId = uuidv4();
    fetchMock.mock(
      {
        url: '/api/videos/some-video-id/livesessions/',
        body: {
          anonymous_id: anonymousId,
          email: 'test@open-fun.fr',
          language: 'fr',
        },
        method: 'POST',
      },
      {
        anonymous_id: anonymousId,
        email: 'test@open-fun.fr',
        id: '42',
        language: 'fr',
      },
    );

    const liveSession = await createLiveSession(
      'some-video-id',
      'test@open-fun.fr',
      'fr',
      anonymousId,
    );

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(liveSession).toEqual({
      anonymous_id: anonymousId,
      email: 'test@open-fun.fr',
      id: '42',
      language: 'fr',
    });
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
      'Accept-Language': 'en',
    });
  });

  it('throws when it fails to create the liveSession and returns a json Error', async () => {
    fetchMock.mock('/api/videos/some-video-id/livesessions/', {
      body: JSON.stringify({ email: 'Invalid email!' }),
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    let thrownError;
    try {
      await createLiveSession('some-video-id', uuidv4(), 'fr');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toEqual({
      code: 'invalid',
      email: 'Invalid email!',
    });
  });
});

import { faker } from '@faker-js/faker';
import fetchMock from 'fetch-mock';
import { liveSessionFactory, useJwt } from 'lib-components';
import { v4 as uuidv4 } from 'uuid';

import { setLiveSessionDisplayName } from '.';

describe('setLiveSessionDisplayName', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  it('returns a liveSession without anonymous_id', async () => {
    const liveSession = liveSessionFactory();
    const displayName = faker.internet.userName();

    fetchMock.mock(
      {
        body: { display_name: displayName },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        url: '/api/videos/some-video-id/livesessions/display_name/',
      },
      {
        ...liveSession,
        display_name: displayName,
      },
    );

    const response = await setLiveSessionDisplayName(
      'some-video-id',
      displayName,
    );

    expect(response.success).toEqual({
      ...liveSession,
      display_name: displayName,
    });
  });

  it('returns a liveSession with an anonymous_id', async () => {
    const anonymousId = uuidv4();
    const liveSession = liveSessionFactory({
      anonymous_id: anonymousId,
    });
    const displayName = faker.internet.userName();

    fetchMock.mock(
      {
        body: { display_name: displayName, anonymous_id: anonymousId },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        url: '/api/videos/some-video-id/livesessions/display_name/',
      },
      {
        ...liveSession,
        display_name: displayName,
      },
    );

    const response = await setLiveSessionDisplayName(
      'some-video-id',
      displayName,
      anonymousId,
    );

    expect(response.success).toEqual({
      ...liveSession,
      display_name: displayName,
    });
  });

  it('returns a 409 error when the display_name already exists', async () => {
    const displayName = faker.internet.userName();
    fetchMock.mock(
      {
        body: { display_name: displayName },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        url: '/api/videos/some-video-id/livesessions/display_name/',
      },
      409,
    );

    const response = await setLiveSessionDisplayName(
      'some-video-id',
      displayName,
    );

    expect(response).toEqual({ error: 409 });
  });

  it('returns any error when the request fails', async () => {
    const displayName = faker.internet.userName();
    fetchMock.mock(
      {
        body: { display_name: displayName },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        url: '/api/videos/some-video-id/livesessions/display_name/',
      },
      {
        body: { detail: 'Invalid request.' },
        status: 400,
      },
    );

    const response = await setLiveSessionDisplayName(
      'some-video-id',
      displayName,
    );

    expect(response).toEqual({ error: { detail: 'Invalid request.' } });
  });
});

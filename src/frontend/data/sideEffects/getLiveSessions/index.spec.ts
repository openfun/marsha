import fetchMock from 'fetch-mock';
import { v4 as uuidv4 } from 'uuid';

import { liveSessionFactory } from 'utils/tests/factories';
import { getLiveSessions } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

describe('getLiveSessions', () => {
  afterEach(() => fetchMock.restore());

  it('getLiveRegitrations without anonymous_id', async () => {
    const expectedLiveSession = liveSessionFactory();
    fetchMock.mock(
      '/api/livesessions/',
      JSON.stringify({
        count: 1,
        results: [expectedLiveSession],
      }),
    );

    const results = await getLiveSessions();
    expect(results).toEqual({
      count: 1,
      results: [expectedLiveSession],
    });
  });

  it('getLiveRegitrations with anonymous_id', async () => {
    const anonymousId = uuidv4();
    const expectedLiveSession = liveSessionFactory({
      anonymous_id: anonymousId,
    });

    fetchMock.mock(
      `/api/livesessions/?anonymous_id=${anonymousId}`,
      JSON.stringify({
        count: 1,
        results: [expectedLiveSession],
      }),
    );

    const results = await getLiveSessions(anonymousId);
    expect(results).toEqual({
      count: 1,
      results: [expectedLiveSession],
    });
  });

  it('raises an error when it fails to get livesessions (api)', async () => {
    fetchMock.mock(
      '/api/livesessions/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(getLiveSessions()).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('raises an error when it fails to get live livesessions (local)', async () => {
    fetchMock.mock('/api/livesessions/', 500);

    await expect(getLiveSessions()).rejects.toThrowError(
      'Failed to get livesessions',
    );
  });
});

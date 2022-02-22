import fetchMock from 'fetch-mock';
import { v4 as uuidv4 } from 'uuid';

import { liveRegistrationFactory } from 'utils/tests/factories';
import { getLiveRegistrations } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

describe('getLiveRegistrations', () => {
  afterEach(() => fetchMock.restore());

  it('getLiveRegitrations without anonymous_id', async () => {
    const expectedLiveRegistration = liveRegistrationFactory();
    fetchMock.mock(
      '/api/liveregistrations/',
      JSON.stringify({
        count: 1,
        results: [expectedLiveRegistration],
      }),
    );

    const results = await getLiveRegistrations();
    expect(results).toEqual({
      count: 1,
      results: [expectedLiveRegistration],
    });
  });

  it('getLiveRegitrations with anonymous_id', async () => {
    const anonymousId = uuidv4();
    const expectedLiveRegistration = liveRegistrationFactory({
      anonymous_id: anonymousId,
    });

    fetchMock.mock(
      `/api/liveregistrations/?anonymous_id=${anonymousId}`,
      JSON.stringify({
        count: 1,
        results: [expectedLiveRegistration],
      }),
    );

    const results = await getLiveRegistrations(anonymousId);
    expect(results).toEqual({
      count: 1,
      results: [expectedLiveRegistration],
    });
  });

  it('raises an error when it fails to get live registrations (api)', async () => {
    fetchMock.mock(
      '/api/liveregistrations/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(getLiveRegistrations()).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('raises an error when it fails to get live registrations (local)', async () => {
    fetchMock.mock('/api/liveregistrations/', 500);

    await expect(getLiveRegistrations()).rejects.toThrowError(
      'Failed to get live registrations',
    );
  });
});

import * as faker from 'faker';
import fetchMock from 'fetch-mock';
import { v4 as uuidv4 } from 'uuid';

import { liveRegistrationFactory } from 'utils/tests/factories';
import { setLiveRegistrationDisplayName } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

describe('setLiveRegistrationDisplayName', () => {
  afterEach(() => fetchMock.restore());

  it('returns a liveRegistration without anonymous_id', async () => {
    const liveRegistration = liveRegistrationFactory();
    const displayName = faker.internet.userName();

    fetchMock.mock(
      {
        body: { display_name: displayName },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        url: '/api/liveregistrations/display_name/',
      },
      {
        ...liveRegistration,
        display_name: displayName,
      },
    );

    const response = await setLiveRegistrationDisplayName(displayName);

    expect(response.success).toEqual({
      ...liveRegistration,
      display_name: displayName,
    });
  });

  it('returns a liveRegistration with an anonymous_id', async () => {
    const anonymousId = uuidv4();
    const liveRegistration = liveRegistrationFactory({
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
        url: '/api/liveregistrations/display_name/',
      },
      {
        ...liveRegistration,
        display_name: displayName,
      },
    );

    const response = await setLiveRegistrationDisplayName(
      displayName,
      anonymousId,
    );

    expect(response.success).toEqual({
      ...liveRegistration,
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
        url: '/api/liveregistrations/display_name/',
      },
      409,
    );

    const response = await setLiveRegistrationDisplayName(displayName);

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
        url: '/api/liveregistrations/display_name/',
      },
      {
        body: { detail: 'Invalid request.' },
        status: 400,
      },
    );

    const response = await setLiveRegistrationDisplayName(displayName);

    expect(response).toEqual({ error: { detail: 'Invalid request.' } });
  });
});

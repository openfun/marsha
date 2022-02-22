import fetchMock from 'fetch-mock';
import { v4 as uuidv4 } from 'uuid';

import { liveRegistrationFactory } from 'utils/tests/factories';
import { pushAttendance } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

describe('pushAttendance', () => {
  afterEach(() => fetchMock.restore());

  it('push new attendance without anonymous_id', async () => {
    const liveAttendance = { key1: 'value1' };
    const expectedLiveRegistration = liveRegistrationFactory({
      live_attendance: liveAttendance,
    });
    fetchMock.mock(
      {
        url: '/api/liveregistrations/push_attendance/',
        body: { live_attendance: liveAttendance },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      expectedLiveRegistration,
    );

    const response = await pushAttendance(liveAttendance);
    expect(response).toEqual(expectedLiveRegistration);
  });

  it('push new attendance with anonymous_id', async () => {
    const liveAttendance = { key1: 'value1' };
    const anonymousId = uuidv4();
    const expectedLiveRegistration = liveRegistrationFactory({
      anonymous_id: anonymousId,
      live_attendance: liveAttendance,
    });
    fetchMock.mock(
      {
        url: `/api/liveregistrations/push_attendance/?anonymous_id=${anonymousId}`,
        body: { live_attendance: liveAttendance },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      expectedLiveRegistration,
    );

    const response = await pushAttendance(liveAttendance, anonymousId);
    expect(response).toEqual(expectedLiveRegistration);
  });

  it('raises an error when it fails to push new attendance (api)', async () => {
    const liveAttendance = { key1: 'value1' };
    fetchMock.mock(
      {
        url: '/api/liveregistrations/push_attendance/',
        body: { live_attendance: liveAttendance },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(pushAttendance(liveAttendance)).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('raises an error when it fails to push new attendances (local)', async () => {
    const liveAttendance = { key1: 'value1' };
    fetchMock.mock(
      {
        url: '/api/liveregistrations/push_attendance/',
        body: { live_attendance: liveAttendance },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      400,
    );

    await expect(pushAttendance(liveAttendance)).rejects.toThrowError(
      'Failed to push attendance',
    );
  });
});

import fetchMock from 'fetch-mock';
import { useJwt, liveSessionFactory } from 'lib-components';
import { v4 as uuidv4 } from 'uuid';

import { pushAttendance } from '.';

describe('pushAttendance', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  it('push new attendance without anonymous_id', async () => {
    const liveAttendance = { key1: 'value1' };
    const expectedLiveSession = liveSessionFactory({
      live_attendance: liveAttendance,
    });
    fetchMock.mock(
      {
        url: '/api/videos/some-video-id/livesessions/push_attendance/',
        body: { live_attendance: liveAttendance, language: 'fr' },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      expectedLiveSession,
    );

    const response = await pushAttendance(
      'some-video-id',
      liveAttendance,
      'fr',
    );
    expect(response).toEqual(expectedLiveSession);
  });

  it('push new attendance with anonymous_id', async () => {
    const liveAttendance = { key1: 'value1' };
    const anonymousId = uuidv4();
    const expectedLiveSession = liveSessionFactory({
      anonymous_id: anonymousId,
      language: 'fr',
      live_attendance: liveAttendance,
    });
    fetchMock.mock(
      {
        url: `/api/videos/some-video-id/livesessions/push_attendance/?anonymous_id=${anonymousId}`,
        body: { live_attendance: liveAttendance, language: 'fr' },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      expectedLiveSession,
    );

    const response = await pushAttendance(
      'some-video-id',
      liveAttendance,
      'fr',
      anonymousId,
    );
    expect(response).toEqual(expectedLiveSession);
  });

  it('raises an error when it fails to push new attendance (api)', async () => {
    const liveAttendance = { key1: 'value1' };
    fetchMock.mock(
      {
        url: '/api/videos/some-video-id/livesessions/push_attendance/',
        body: { live_attendance: liveAttendance, language: 'fr' },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      pushAttendance('some-video-id', liveAttendance, 'fr'),
    ).rejects.toThrow('Failed to perform the request');
  });

  it('raises an error when it fails to push new attendances (local)', async () => {
    const liveAttendance = { key1: 'value1' };
    fetchMock.mock(
      {
        url: '/api/videos/some-video-id/livesessions/push_attendance/',
        body: { live_attendance: liveAttendance, language: 'en' },
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      400,
    );

    await expect(
      pushAttendance('some-video-id', liveAttendance, 'en'),
    ).rejects.toThrow('Failed to push attendance');
  });
});

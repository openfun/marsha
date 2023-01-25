import {
  fetchWrapper,
  useJwt,
  API_ENDPOINT,
  LiveSession,
} from 'lib-components';

export const pushAttendance = async (
  liveAttendance: LiveSession['live_attendance'],
  language: string,
  anonymousId?: string,
): Promise<LiveSession> => {
  let endpoint = `${API_ENDPOINT}/livesessions/push_attendance/`;
  if (anonymousId) {
    endpoint = `${endpoint}?anonymous_id=${anonymousId}`;
  }

  const response = await fetchWrapper(endpoint, {
    body: JSON.stringify({ live_attendance: liveAttendance, language }),
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to push attendance');
  }

  return response.json() as unknown as LiveSession;
};

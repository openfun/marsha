import { appData } from 'data/appData';
import { API_ENDPOINT } from 'settings';
import { LiveRegistration } from 'types/tracks';

export const pushAttendance = async (
  liveAttendance: LiveRegistration['live_attendance'],
  anonymousId?: string,
): Promise<LiveRegistration> => {
  let endpoint = `${API_ENDPOINT}/liveregistrations/push_attendance/`;
  if (anonymousId) {
    endpoint = `${endpoint}?anonymous_id=${anonymousId}`;
  }

  const response = await fetch(endpoint, {
    body: JSON.stringify({ live_attendance: liveAttendance }),
    headers: {
      Authorization: `Bearer ${appData.jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to push attendance');
  }

  return response.json();
};

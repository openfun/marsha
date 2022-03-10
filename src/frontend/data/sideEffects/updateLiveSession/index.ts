import { appData } from 'data/appData';
import { API_ENDPOINT } from 'settings';
import { LiveSession } from 'types/tracks';

export const updateLiveSession = async (
  liveSession: LiveSession,
  email?: string,
  isRegistered?: boolean,
  anonymousId?: string,
): Promise<LiveSession> => {
  const body = {
    email,
    is_registered: isRegistered,
  };

  let endpoint = `${API_ENDPOINT}/livesessions/${liveSession.id}/`;
  if (anonymousId) {
    endpoint = `${endpoint}?anonymous_id=${anonymousId}`;
  }

  const response = await fetch(endpoint, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${appData.jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  });

  if (!response.ok) {
    throw { code: 'invalid', ...(await response.json()) };
  }
  return response.json();
};

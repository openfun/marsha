import { useJwt } from 'lib-components';

import { API_ENDPOINT } from 'settings';
import { LiveSession } from 'lib-components';

export const updateLiveSession = async (
  liveSession: LiveSession,
  language: string,
  email?: string,
  isRegistered?: boolean,
  anonymousId?: string,
): Promise<LiveSession> => {
  const body = {
    email,
    is_registered: isRegistered,
    language,
  };

  let endpoint = `${API_ENDPOINT}/livesessions/${liveSession.id}/`;
  if (anonymousId) {
    endpoint = `${endpoint}?anonymous_id=${anonymousId}`;
  }

  const response = await fetch(endpoint, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  });

  if (!response.ok) {
    throw { code: 'invalid', ...(await response.json()) };
  }
  return response.json();
};

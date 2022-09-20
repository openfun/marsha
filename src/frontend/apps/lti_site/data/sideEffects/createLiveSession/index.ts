import { useJwt } from 'lib-components';

import { API_ENDPOINT } from 'settings';
import { LiveSession } from 'types/tracks';

/**
 * Create a new liveSession record for an email and the video of the jwt token.
 */
export const createLiveSession = async (
  email: string,
  language: string,
  anonymousId?: string,
): Promise<LiveSession> => {
  const body = {
    email,
    language,
    anonymous_id: anonymousId,
  };
  const response = await fetch(`${API_ENDPOINT}/livesessions/`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw { code: 'invalid', ...(await response.json()) };
  }
  return response.json();
};

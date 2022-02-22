import { API_ENDPOINT } from 'settings';
import { LiveRegistration } from 'types/tracks';
import { appData } from 'data/appData';

/**
 * Create a new liveRegistration record for an email and the video of the jwt token.
 */
export const createLiveRegistration = async (
  email: string,
  anonymousId?: string,
): Promise<LiveRegistration> => {
  const body = {
    email,
    anonymous_id: anonymousId,
  };
  const response = await fetch(`${API_ENDPOINT}/liveregistrations/`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${appData.jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw { code: 'invalid', ...(await response.json()) };
  }
  return response.json();
};

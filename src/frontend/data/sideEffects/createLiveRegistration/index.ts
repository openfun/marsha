import { API_ENDPOINT } from '../../../settings';
import { LiveRegistration } from '../../../types/tracks';
import { appData } from '../../appData';

/**
 * Create a new liveRegistration record for an email and the video of the jwt token.
 */
export const createLiveRegistration = async (email: string) => {
  const response = await fetch(`${API_ENDPOINT}/liveregistrations/`, {
    body: JSON.stringify({ email }),
    headers: {
      Authorization: `Bearer ${appData.jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create a new liveRegistration with ${email}: error ${response.status}.`,
    );
  }

  return (await response.json()) as LiveRegistration;
};

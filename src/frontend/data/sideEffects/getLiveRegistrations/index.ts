import { appData } from 'data/appData';
import { API_ENDPOINT } from 'settings';
import { LiveRegistration } from 'types/tracks';

export const getLiveRegistrations = async (
  anonymousId?: string,
): Promise<{
  count: number;
  results: LiveRegistration[];
}> => {
  let endpoint = `${API_ENDPOINT}/liveregistrations/`;
  if (anonymousId) {
    endpoint = `${endpoint}?anonymous_id=${anonymousId}`;
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${appData.jwt}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get live registrations');
  }

  return response.json();
};

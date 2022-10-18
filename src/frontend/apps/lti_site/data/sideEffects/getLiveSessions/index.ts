import { useJwt } from 'lib-components';

import { API_ENDPOINT } from 'lib-components';
import { LiveSession } from 'lib-components';

export const getLiveSessions = async (
  anonymousId?: string,
): Promise<{
  count: number;
  results: LiveSession[];
}> => {
  let endpoint = `${API_ENDPOINT}/livesessions/`;
  if (anonymousId) {
    endpoint = `${endpoint}?anonymous_id=${anonymousId}`;
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get livesessions');
  }

  return response.json();
};

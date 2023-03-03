import {
  fetchWrapper,
  useJwt,
  API_ENDPOINT,
  LiveSession,
} from 'lib-components';

/**
 * Create a new liveSession record for an email and the video of the jwt token.
 */
export const createLiveSession = async (
  videoId: string,
  email: string,
  language: string,
  anonymousId?: string,
): Promise<LiveSession> => {
  const body = {
    email,
    language,
    anonymous_id: anonymousId,
  };
  const jwt = useJwt.getState().jwt;
  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${videoId}/livesessions/`,
    {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${jwt ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw { code: 'invalid', ...(await response.json()) };
  }
  return (await response.json()) as LiveSession;
};

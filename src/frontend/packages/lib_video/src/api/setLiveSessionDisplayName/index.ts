import {
  fetchWrapper,
  useJwt,
  API_ENDPOINT,
  LiveSession,
} from 'lib-components';

export const setLiveSessionDisplayName = async (
  videoId: string,
  displayName: string,
  anonymousId?: string,
): Promise<{
  error?: string | number;
  success?: LiveSession;
}> => {
  const body = {
    display_name: displayName,
    anonymous_id: anonymousId,
  };

  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${videoId}/livesessions/display_name/`,
    {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    },
  );

  if (response.status === 409) {
    return { error: 409 };
  }

  if (!response.ok) {
    return { error: (await response.json()) as string | number | undefined };
  }

  return { success: (await response.json()) as LiveSession };
};

import {
  fetchWrapper,
  useJwt,
  API_ENDPOINT,
  SharedLiveMedia,
} from 'lib-components';

export const createSharedLiveMedia = async () => {
  const response = await fetchWrapper(`${API_ENDPOINT}/sharedlivemedias/`, {
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to create a new shared live media.');
  }

  const sharedLiveMedia = (await response.json()) as SharedLiveMedia;

  return sharedLiveMedia;
};

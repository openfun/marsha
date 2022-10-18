import { useJwt } from 'lib-components';

import { API_ENDPOINT } from 'lib-components';
import { SharedLiveMedia } from 'lib-components';

export const createSharedLiveMedia = async () => {
  const response = await fetch(`${API_ENDPOINT}/sharedlivemedias/`, {
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to create a new shared live media.');
  }

  const sharedLiveMedia: SharedLiveMedia = await response.json();

  return sharedLiveMedia;
};

import { appData } from 'data/appData';
import { API_ENDPOINT } from 'settings';
import { SharedLiveMedia } from 'types/tracks';

export const createSharedLiveMedia = async () => {
  const response = await fetch(`${API_ENDPOINT}/sharedlivemedias/`, {
    headers: {
      Authorization: `Bearer ${appData.jwt}`,
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

import {
  fetchWrapper,
  useJwt,
  API_ENDPOINT,
  SharedLiveMedia,
  fetchResponseHandler,
} from 'lib-components';

interface createSharedLiveMediaBody {
  video: string;
}

export const createSharedLiveMedia = async (
  body: createSharedLiveMediaBody,
): Promise<SharedLiveMedia> => {
  const response = await fetchWrapper(`${API_ENDPOINT}/sharedlivemedias/`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  return await fetchResponseHandler(response, {
    errorMessage: `Failed to create a new shared live media.`,
  });
};

import {
  API_ENDPOINT,
  SharedLiveMedia,
  fetchResponseHandler,
  fetchWrapper,
  useJwt,
} from 'lib-components';

interface createSharedLiveMediaBody {
  video: string;
}

export const createSharedLiveMedia = async ({
  video,
}: createSharedLiveMediaBody): Promise<SharedLiveMedia> => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${video}/sharedlivemedias/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  return await fetchResponseHandler(response, {
    errorMessage: `Failed to create a new shared live media.`,
  });
};

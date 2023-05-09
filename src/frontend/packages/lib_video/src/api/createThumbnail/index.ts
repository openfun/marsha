import {
  fetchWrapper,
  useJwt,
  API_ENDPOINT,
  modelName,
  Thumbnail,
  fetchResponseHandler,
} from 'lib-components';

interface createThumbnailBody {
  size: number;
  video: string;
}

/**
 * Create a new thumbnail record for a language-mode combination.
 */
export const createThumbnail = async ({
  video,
  ...body
}: createThumbnailBody): Promise<Thumbnail> => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${video}/${modelName.THUMBNAILS}/`,
    {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  return await fetchResponseHandler(response);
};

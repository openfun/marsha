import { fetchWrapper } from '@lib-components/common/queries/fetchWrapper';
import { useJwt } from '@lib-components/hooks/stores';
import { API_ENDPOINT } from '@lib-components/settings';
import { AWSPresignedPost } from '@lib-components/types/AWSPresignedPost';
import { uploadableModelName } from '@lib-components/types/models';
import { UploadableObject } from '@lib-components/types/tracks';

/**
 * Post to an action endpoint that declares the beginning of an upload. Returns the AWS upload
 * policy to authenticate this upload with S3.
 * @param objectType The kind of object for which we're uploading a file (model name).
 * @param objectId The ID of the object for which we're uploading a file.
 */
export const initiateUpload = async (
  objectType: uploadableModelName,
  objectId: UploadableObject['id'],
  filename: string,
  mimetype: string,
  size: number,
) => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/${objectType}/${objectId}/initiate-upload/`,
    {
      body: JSON.stringify({
        filename,
        mimetype,
        size,
      }),
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (
      response.status === 400 &&
      contentType &&
      contentType.indexOf('application/json') !== -1
    ) {
      const error = (await response.json()) as { [key: string]: string };
      if (error.hasOwnProperty('size')) {
        throw { type: 'SizeError', data: error };
      }
    }
    throw {
      type: 'ApiError',
      data: {
        message: `Failed to trigger initiate-upload on the API for ${objectType}/${objectId}.`,
      },
    };
  }

  return (await response.json()) as AWSPresignedPost;
};

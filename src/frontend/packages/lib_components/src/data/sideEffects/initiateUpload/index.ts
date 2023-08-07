import { Maybe } from '@lib-common/types';

import { UploadingObject } from '@lib-components/common';
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
 * @param filename The name of the file we're uploading.
 * @param mimetype The mimetype of the file we're uploading.
 * @param size The size of the file we're uploading.
 * @param parentType The kind of parent object for which we're uploading a file (nullable model name).
 * @param parentId The ID of the parent object for which we're uploading a file (nullable).
 */
export const initiateUpload = async (
  objectType: uploadableModelName,
  objectId: UploadableObject['id'],
  filename: string,
  mimetype: string,
  size: number,
  parentType?: Maybe<UploadingObject['parentType']>,
  parentId?: Maybe<string>,
) => {
  let input = `${API_ENDPOINT}/${objectType}/${objectId}/initiate-upload/`;
  if (parentId && parentType) {
    input = `${API_ENDPOINT}/${parentType}/${parentId}/${objectType}/${objectId}/initiate-upload/`;
  }
  const response = await fetchWrapper(input, {
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
  });

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

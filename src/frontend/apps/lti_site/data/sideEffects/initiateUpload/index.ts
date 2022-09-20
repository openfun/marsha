import { useJwt } from 'lib-components';

import { API_ENDPOINT } from 'settings';
import { uploadableModelName } from 'types/models';
import { UploadableObject } from 'types/tracks';

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
) => {
  const response = await fetch(
    `${API_ENDPOINT}/${objectType}/${objectId}/initiate-upload/`,
    {
      body: JSON.stringify({
        filename,
        mimetype,
      }),
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to trigger initiate-upload on the API for ${objectType}/${objectId}.`,
    );
  }

  return await response.json();
};

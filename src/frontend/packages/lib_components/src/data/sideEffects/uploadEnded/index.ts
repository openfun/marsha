import { Maybe } from '@lib-common/types';
import {
  API_ENDPOINT,
  UploadableObject,
  fetchResponseHandler,
  fetchWrapper,
  getParentType,
  uploadableModelName,
  useJwt,
} from 'lib-components';

/**
 * Post to an action endpoint to inform the end of the object upload.
 * Returns the updated object
 * @param objectType The kind of object for which we're ending the upload (model name).
 * @param objectId The ID of the object for which we're ending the upload.
 * @param fileKey The file key that was uploaded to S3.
 * @param parentId The ID of the parent object for which we're ending the upload (nullable).
 */
export const uploadEnded = async <T = UploadableObject>(
  objectType: uploadableModelName,
  objectId: UploadableObject['id'],
  fileKey: string,
  parentId?: Maybe<string>,
): Promise<T> => {
  let input = `${API_ENDPOINT}/${objectType}/${objectId}/upload-ended/`;
  const parentType = getParentType(objectType);
  if (parentId && parentType) {
    input = `${API_ENDPOINT}/${parentType}/${parentId}/${objectType}/${objectId}/upload-ended/`;
  }

  const body = {
    file_key: fileKey,
  };

  const response = await fetchWrapper(input, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  return (await fetchResponseHandler(response, {
    errorMessage: `Failed to end the upload for ${objectType}/${objectId}.`,
  })) as T;
};

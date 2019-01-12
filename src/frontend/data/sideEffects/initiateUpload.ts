import { API_ENDPOINT } from '../../settings';
import { modelName } from '../../types/models';
import { UploadableObject } from '../../types/tracks';
import { Nullable } from '../../utils/types';

export const initiateUpload = async (
  jwt: Nullable<string>,
  objectType: modelName,
  objectId: UploadableObject['id'],
) => {
  const response = await fetch(
    `${API_ENDPOINT}/${objectType}/${objectId}/initiate-upload/`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
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

import { API_ENDPOINT } from '../../../settings';
import { modelName } from '../../../types/models';
import { TimedText } from '../../../types/tracks';
import { Nullable } from '../../../utils/types';

/**
 * Delete one timedtexttrack record.
 * @param jwt The token that will be used to authenticate with the API.
 * @param timedtexttrack The timedtexttrack to delete.
 */
export const deleteTimedTextTrack = async (
  jwt: Nullable<string>,
  timedtexttrack: TimedText,
) => {
  const response = await fetch(
    `${API_ENDPOINT}/${modelName.TIMEDTEXTTRACKS}/${timedtexttrack.id}/`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to delete ${modelName.TIMEDTEXTTRACKS}/${timedtexttrack.id}.`,
    );
  }

  return true;
};

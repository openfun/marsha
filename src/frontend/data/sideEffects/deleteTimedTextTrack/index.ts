import { API_ENDPOINT } from '../../../settings';
import { modelName } from '../../../types/models';
import { TimedText } from '../../../types/tracks';
import { appData } from '../../appData';

/**
 * Delete one timedtexttrack record.
 * @param timedtexttrack The timedtexttrack to delete.
 */
export const deleteTimedTextTrack = async (timedtexttrack: TimedText) => {
  const response = await fetch(
    `${API_ENDPOINT}/${modelName.TIMEDTEXTTRACKS}/${timedtexttrack.id}/`,
    {
      headers: {
        Authorization: `Bearer ${appData.jwt}`,
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

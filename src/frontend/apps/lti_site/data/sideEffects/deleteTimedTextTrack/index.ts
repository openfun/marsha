import { useJwt } from 'lib-components';

import { API_ENDPOINT } from 'lib-components';
import { modelName } from 'lib-components';
import { TimedText } from 'lib-components';

/**
 * Delete one timedtexttrack record.
 * @param timedtexttrack The timedtexttrack to delete.
 */
export const deleteTimedTextTrack = async (timedtexttrack: TimedText) => {
  const response = await fetch(
    `${API_ENDPOINT}/${modelName.TIMEDTEXTTRACKS}/${timedtexttrack.id}/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt}`,
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

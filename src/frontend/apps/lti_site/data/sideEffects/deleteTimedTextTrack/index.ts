import {
  API_ENDPOINT,
  TimedText,
  fetchWrapper,
  modelName,
  useJwt,
} from 'lib-components';

/**
 * Delete one timedtexttrack record.
 * @param timedtexttrack The timedtexttrack to delete.
 */
export const deleteTimedTextTrack = async (timedtexttrack: TimedText) => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/${modelName.TIMEDTEXTTRACKS}/${timedtexttrack.id}/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt()}`,
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

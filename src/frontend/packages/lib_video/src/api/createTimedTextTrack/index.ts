import {
  fetchWrapper,
  useJwt,
  API_ENDPOINT,
  modelName,
  TimedText,
  timedTextMode,
} from 'lib-components';

/**
 * Create a new timedtexttrack record for a language-mode combination.
 * @param language The language for the new timedtexttrack (from the list of available choices).
 * @param mode The mode for the new timedtexttrack.
 */
export const createTimedTextTrack = async (
  language: string,
  mode: timedTextMode,
  size: number,
) => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/${modelName.TIMEDTEXTTRACKS}/`,
    {
      body: JSON.stringify({ language, mode, size }),
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw await response.json();
  }

  const timedtexttrack = (await response.json()) as TimedText;

  return timedtexttrack;
};

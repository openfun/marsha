import {
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
) => {
  const response = await fetch(
    `${API_ENDPOINT}/${modelName.TIMEDTEXTTRACKS}/`,
    {
      body: JSON.stringify({ language, mode }),
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to create a new TimedTextTrack with ${language}, ${mode}: ${response.status}.`,
    );
  }

  const timedtexttrack = (await response.json()) as TimedText;

  return timedtexttrack;
};

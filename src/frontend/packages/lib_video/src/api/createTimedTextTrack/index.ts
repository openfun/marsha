import {
  API_ENDPOINT,
  TimedText,
  fetchResponseHandler,
  fetchWrapper,
  modelName,
  timedTextMode,
  useJwt,
} from 'lib-components';

interface createTimedTextTrackBody {
  language: string;
  mode: timedTextMode;
  size: number;
  video: string;
}

/**
 * Create a new timedtexttrack record for a language-mode combination.
 * @param language The language for the new timedtexttrack (from the list of available choices).
 * @param mode The mode for the new timedtexttrack.
 */
export const createTimedTextTrack = async ({
  video,
  ...body
}: createTimedTextTrackBody): Promise<TimedText> => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${video}/${modelName.TIMEDTEXTTRACKS}/`,
    {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  return await fetchResponseHandler(response);
};

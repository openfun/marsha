import { API_ENDPOINT } from '../../../settings';
import { modelName } from '../../../types/models';
import { TimedText } from '../../../types/tracks';
import { Nullable } from '../../../utils/types';

/**
 * Get the list of timedtexttracks related to the video the passed token is linked to.
 * @param jwt The token that will be used to authenticate with the API.
 */
export const getTimedTextTrackList = async (jwt: Nullable<string>) => {
  const response = await fetch(
    `${API_ENDPOINT}/${modelName.TIMEDTEXTTRACKS}/`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get ${modelName.TIMEDTEXTTRACKS} list.`);
  }

  const timedtexttracks: TimedText[] = await response.json();

  return timedtexttracks;
};

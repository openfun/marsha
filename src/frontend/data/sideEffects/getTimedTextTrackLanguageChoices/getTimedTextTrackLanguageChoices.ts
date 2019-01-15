import { API_ENDPOINT } from '../../../settings';
import { modelName } from '../../../types/models';
import { RouteOptions } from '../../../types/RouteOptions';
import { TimedText } from '../../../types/tracks';
import { Nullable } from '../../../utils/types';

/**
 * Get the list of available choices for the language filed on timedtexttracks.
 * @param jwt The token that will be used to authenticate with the API.
 */
export const getTimedTextTrackLanguageChoices = async (
  jwt: Nullable<string>,
) => {
  const response = await fetch(
    `${API_ENDPOINT}/${modelName.TIMEDTEXTTRACKS}/`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      method: 'OPTIONS',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get ${API_ENDPOINT}/${modelName.TIMEDTEXTTRACKS}/.`,
    );
  }

  const routeOptions: RouteOptions<TimedText> = await response.json();

  return routeOptions.actions.POST.language.choices!.map(
    ({ display_name, value }) => ({
      label: display_name,
      value,
    }),
  );
};

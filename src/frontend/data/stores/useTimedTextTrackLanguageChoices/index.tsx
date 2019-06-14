import create from 'zustand';

import { API_ENDPOINT } from '../../../settings';
import { requestStatus } from '../../../types/api';
import { LanguageChoice } from '../../../types/LanguageChoice';
import { modelName } from '../../../types/models';
import { RouteOptions } from '../../../types/RouteOptions';
import { TimedText } from '../../../types/tracks';
import { report } from '../../../utils/errors/report';
import { Maybe } from '../../../utils/types';
import { appData } from '../../appData';

export const [
  useTimedTextTrackLanguageChoices,
  useTimedTextTrackLanguageChoicesApi,
] = create((set, get) => ({
  choices: undefined as Maybe<LanguageChoice[]>,
  getChoices: async () => {
    const jwt = appData.jwt;
    const choices = get().choices;

    if (!choices) {
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
        report(
          new Error(
            `Failed to fetch OPTIONS ${API_ENDPOINT}/${modelName.TIMEDTEXTTRACKS}/`,
          ),
        );
        return requestStatus.FAILURE;
      }

      const routeOptions: RouteOptions<TimedText> = await response.json();
      set({
        choices: routeOptions.actions.POST.language.choices!.map(
          ({ display_name, value }) => ({
            label: display_name,
            value,
          }),
        ),
      });
    }

    return requestStatus.SUCCESS;
  },
}));

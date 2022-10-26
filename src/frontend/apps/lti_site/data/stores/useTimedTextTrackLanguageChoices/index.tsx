import { Maybe } from 'lib-common';
import create from 'zustand';

import {
  useJwt,
  API_ENDPOINT,
  requestStatus,
  modelName,
  TimedText,
  report,
} from 'lib-components';
import { RouteOptions } from 'types/RouteOptions';
import { LanguageChoice } from 'types/SelectOptions';

type State = {
  choices: Maybe<LanguageChoice[]>;
  getChoices: () => Promise<requestStatus>;
};

export const useTimedTextTrackLanguageChoices = create<State>((set, get) => ({
  choices: undefined,
  getChoices: async () => {
    const jwt = useJwt.getState().jwt;
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

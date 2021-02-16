import create from 'zustand';

import { API_ENDPOINT } from '../../../settings';
import { RequestStatus } from '../../../types/api';
import { LanguageChoice } from '../../../types/LanguageChoice';
import { ModelName } from '../../../types/models';
import { RouteOptions } from '../../../types/RouteOptions';
import { TimedText } from '../../../types/tracks';
import { report } from '../../../utils/errors/report';
import { Maybe } from '../../../utils/types';
import { appData } from '../../appData';

type State = {
  choices: Maybe<LanguageChoice[]>;
  getChoices: () => Promise<RequestStatus>;
};

export const useTimedTextTrackLanguageChoices = create<State>((set, get) => ({
  choices: undefined,
  getChoices: async () => {
    const { jwt } = appData;
    const { choices } = get();

    if (!choices) {
      const response = await fetch(
        `${API_ENDPOINT}/${ModelName.TIMEDTEXTTRACKS}/`,
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
            `Failed to fetch OPTIONS ${API_ENDPOINT}/${ModelName.TIMEDTEXTTRACKS}/`,
          ),
        );
        return RequestStatus.FAILURE;
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

    return RequestStatus.SUCCESS;
  },
}));

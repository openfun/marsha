import { call, cancel, put, select, takeLeading } from 'redux-saga/effects';

import { RootState } from '../../../data/rootReducer';
import { API_ENDPOINT } from '../../../settings';
import { requestStatus } from '../../../types/api';
import { appStateSuccess } from '../../../types/AppData';
import { LanguageChoice } from '../../../types/LanguageChoice';
import { modelName } from '../../../types/models';
import { RouteOptions } from '../../../types/RouteOptions';
import { TimedText } from '../../../types/tracks';
import {
  didTimedTextTrackLanguageChoices,
  failedTimedTextTrackLanguageChoices,
  TimedTextTrackLanguageChoicesGet,
} from '../../timedTextTrackLanguageChoices/action';

/**
 * Get the list of available choices for the language filed on timedtexttracks.
 * @param jwt The token that will be used to authenticate with the API.
 */
export async function fetchTimedTextTrackLanguageChoices(
  jwt: string,
): Promise<LanguageChoice[]> {
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
      `Failed to fetch OPTIONS ${API_ENDPOINT}/${modelName.TIMEDTEXTTRACKS}/`,
    );
  }

  const routeOptions: RouteOptions<TimedText> = await response.json();

  return routeOptions.actions.POST.language.choices!.map(
    ({ display_name, value }) => ({
      label: display_name,
      value,
    }),
  );
}

export const selector = (state: RootState<appStateSuccess>) =>
  state.languageChoices.status;

export function* getTimedTextTrackLanguageChoices(
  action: TimedTextTrackLanguageChoicesGet,
) {
  const currentLanguagesChoicesStatus = yield select(selector);

  if (currentLanguagesChoicesStatus === requestStatus.PENDING) {
    const { jwt } = action;
    try {
      const languageChoices: LanguageChoice[] = yield call(
        fetchTimedTextTrackLanguageChoices,
        jwt,
      );
      yield put(didTimedTextTrackLanguageChoices(languageChoices));
    } catch (e) {
      yield put(failedTimedTextTrackLanguageChoices(e.message));
    }
  } else {
    yield cancel();
  }
}

export function* getTimedTextTrackLanguageChoicesSaga() {
  yield takeLeading(
    'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET',
    getTimedTextTrackLanguageChoices,
  );
}

import { AnyAction } from 'redux';

import { requestStatus } from '../../types/api';
import { LanguageChoice } from '../../types/LanguageChoice';
import { Nullable } from '../../utils/types';
import {
  TimedTextTrackLanguageChoicesFailure,
  TimedTextTrackLanguageChoicesGet,
  TimedTextTrackLanguageChoicesSuccess,
} from './action';

export interface TimedTextTrackLanguageChoicesState {
  items: LanguageChoice[];
  status: Nullable<requestStatus>;
}

export type TimedTextTrackLanguageChoicesActions =
  | AnyAction
  | TimedTextTrackLanguageChoicesGet
  | TimedTextTrackLanguageChoicesFailure
  | TimedTextTrackLanguageChoicesSuccess;

export const initialState = {
  items: [],
  status: null,
};

export const timedTextTrackLanguageChoices = (
  state: TimedTextTrackLanguageChoicesState = initialState,
  action: TimedTextTrackLanguageChoicesActions,
): TimedTextTrackLanguageChoicesState => {
  if (state.status === requestStatus.SUCCESS) {
    return state;
  }

  switch (action.type) {
    case 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET':
      return {
        items: [],
        status: requestStatus.PENDING,
      };
    case 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_FAILURE':
      return {
        items: [],
        status: requestStatus.FAILURE,
      };
    case 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_SUCCESS':
      return {
        items: (action as TimedTextTrackLanguageChoicesSuccess).languageChoices,
        status: requestStatus.SUCCESS,
      };
  }

  return state;
};

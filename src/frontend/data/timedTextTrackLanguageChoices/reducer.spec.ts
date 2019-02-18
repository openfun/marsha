import { requestStatus } from '../../types/api';
import { LanguageChoice } from '../../types/LanguageChoice';
import {
  TimedTextTrackLanguageChoicesFailure,
  TimedTextTrackLanguageChoicesGet,
  TimedTextTrackLanguageChoicesSuccess,
} from './action';
import {
  timedTextTrackLanguageChoices,
  TimedTextTrackLanguageChoicesState,
} from './reducer';

describe('Reducer: timedTextTrackLanguageChoices', () => {
  it('returns the state as is when called with an unknown action', () => {
    const previousState: TimedTextTrackLanguageChoicesState = {
      items: [
        {
          label: 'French',
          value: 'fr',
        },
      ],
      status: requestStatus.SUCCESS,
    };

    expect(timedTextTrackLanguageChoices(previousState, { type: '' })).toEqual(
      previousState,
    );
  });

  it('returns empty items and failure status on TIMED_TEXT_TRACK_LANGUAGE_CHOICES_FAILURE action', () => {
    const previousState: TimedTextTrackLanguageChoicesState = {
      items: [],
      status: null,
    };

    const action: TimedTextTrackLanguageChoicesFailure = {
      error: 'it fails !',
      type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_FAILURE',
    };

    expect(timedTextTrackLanguageChoices(previousState, action)).toEqual({
      items: [],
      status: requestStatus.FAILURE,
    });
  });

  it('returns empty items and pending status on TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET action', () => {
    const previousState: TimedTextTrackLanguageChoicesState = {
      items: [],
      status: null,
    };

    const action: TimedTextTrackLanguageChoicesGet = {
      jwt: 'secured token',
      type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET',
    };

    expect(timedTextTrackLanguageChoices(previousState, action)).toEqual({
      items: [],
      status: requestStatus.PENDING,
    });
  });
  it('returns items and success status on TIMED_TEXT_TRACK_LANGUAGE_CHOICES_SUCCESS action', () => {
    const previousState: TimedTextTrackLanguageChoicesState = {
      items: [],
      status: null,
    };

    const items: LanguageChoice[] = [
      {
        label: 'English',
        value: 'en',
      },
      {
        label: 'French',
        value: 'fr',
      },
    ];
    const action: TimedTextTrackLanguageChoicesSuccess = {
      languageChoices: items,
      type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_SUCCESS',
    };

    expect(timedTextTrackLanguageChoices(previousState, action)).toEqual({
      items,
      status: requestStatus.SUCCESS,
    });
  });

  it('returns the current state if status is alreasy in success', () => {
    const previousState: TimedTextTrackLanguageChoicesState = {
      items: [
        {
          label: 'French',
          value: 'fr',
        },
      ],
      status: requestStatus.SUCCESS,
    };

    const action: TimedTextTrackLanguageChoicesGet = {
      jwt: 'secured token',
      type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET',
    };

    expect(timedTextTrackLanguageChoices(previousState, action)).toEqual(
      previousState,
    );
  });
});

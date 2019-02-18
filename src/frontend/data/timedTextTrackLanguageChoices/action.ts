import { LanguageChoice } from '../../types/LanguageChoice';

export interface TimedTextTrackLanguageChoicesGet {
  jwt: string;
  type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET';
}

export const getTimedTextTrackLanguageChoices = (
  jwt: string,
): TimedTextTrackLanguageChoicesGet => ({
  jwt,
  type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET',
});

export interface TimedTextTrackLanguageChoicesFailure {
  error: Error | string;
  type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_FAILURE';
}

export const failedTimedTextTrackLanguageChoices = (
  error: TimedTextTrackLanguageChoicesFailure['error'],
): TimedTextTrackLanguageChoicesFailure => ({
  error,
  type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_FAILURE',
});

export interface TimedTextTrackLanguageChoicesSuccess {
  languageChoices: LanguageChoice[];
  type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_SUCCESS';
}

export const didTimedTextTrackLanguageChoices = (
  languageChoices: LanguageChoice[],
): TimedTextTrackLanguageChoicesSuccess => ({
  languageChoices,
  type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_SUCCESS',
});

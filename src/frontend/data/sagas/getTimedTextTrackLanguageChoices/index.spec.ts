import fetchMock from 'fetch-mock';
import { call, cancel, put, select, takeLeading } from 'redux-saga/effects';

import {
  didTimedTextTrackLanguageChoices,
  failedTimedTextTrackLanguageChoices,
  TimedTextTrackLanguageChoicesGet,
} from '../../../data/timedTextTrackLanguageChoices/action';
import { requestStatus } from '../../../types/api';
import {
  fetchTimedTextTrackLanguageChoices,
  getTimedTextTrackLanguageChoices,
  getTimedTextTrackLanguageChoicesSaga,
  selector,
} from './';

describe('sideEffects/getTimedTextTrackLanguageChoices saga', () => {
  afterEach(fetchMock.restore);

  describe('fetchTimedTextTrackLanguageChoices()', () => {
    it('gets the timedtexttrack route options and returns formatted language choices', async () => {
      const response = {
        actions: {
          POST: {
            language: {
              choices: [
                {
                  display_name: 'English',
                  value: 'en',
                },
                {
                  display_name: 'French',
                  value: 'fr',
                },
              ],
            },
          },
        },
      };
      fetchMock.mock('/api/timedtexttracks/', JSON.stringify(response), {
        method: 'OPTIONS',
      });
      const languageChoices = await fetchTimedTextTrackLanguageChoices(
        'some token',
      );

      expect(languageChoices).toEqual([
        { label: 'English', value: 'en' },
        { label: 'French', value: 'fr' },
      ]);
      expect(fetchMock.lastCall()![1]!.headers).toEqual({
        Authorization: 'Bearer some token',
      });
    });

    it('throws when it fails to get the route options (request failure)', async () => {
      fetchMock.mock(
        '/api/timedtexttracks/',
        Promise.reject(
          new Error('Failed to fetch OPTIONS /api/timedtexttracks/'),
        ),
        { method: 'OPTIONS' },
      );

      await expect(
        fetchTimedTextTrackLanguageChoices('some token'),
      ).rejects.toThrowError('Failed to fetch OPTIONS /api/timedtexttracks/');
    });

    it('throws when it fails to get the route options (API error)', async () => {
      fetchMock.mock('/api/timedtexttracks/', 400, { method: 'OPTIONS' });

      await expect(
        fetchTimedTextTrackLanguageChoices('some token'),
      ).rejects.toThrowError('Failed to fetch OPTIONS /api/timedtexttracks/');
    });
  });

  describe('getTimedTextTrackLanguageChoices()', () => {
    it('fetchs the API and yields the result in a success action', () => {
      const action: TimedTextTrackLanguageChoicesGet = {
        jwt: 'some token',
        type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET',
      };
      const response = [
        {
          label: 'French',
          value: 'fr',
        },
        {
          label: 'English',
          value: 'en',
        },
      ];

      const gen = getTimedTextTrackLanguageChoices(action);
      expect(gen.next().value).toEqual(select(selector));

      expect(gen.next(requestStatus.PENDING).value).toEqual(
        call(fetchTimedTextTrackLanguageChoices, 'some token'),
      );

      expect(gen.next(response).value).toEqual(
        put(didTimedTextTrackLanguageChoices(response)),
      );
    });

    it('fetchs the API and catch request error', () => {
      const action: TimedTextTrackLanguageChoicesGet = {
        jwt: 'some token',
        type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET',
      };

      const gen = getTimedTextTrackLanguageChoices(action);
      expect(gen.next().value).toEqual(select(selector));

      expect(gen.next(requestStatus.PENDING).value).toEqual(
        call(fetchTimedTextTrackLanguageChoices, 'some token'),
      );

      expect(gen.throw!(new Error('request failed')).value).toEqual(
        put(failedTimedTextTrackLanguageChoices('request failed')),
      );
    });

    it('cancels the saga if current language state is in success', () => {
      const action: TimedTextTrackLanguageChoicesGet = {
        jwt: 'some token',
        type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET',
      };

      const gen = getTimedTextTrackLanguageChoices(action);
      expect(gen.next().value).toEqual(select(selector));

      expect(gen.next(requestStatus.SUCCESS).value).toEqual(cancel());
    });

    it('cancels the saga if current language state is in failure', () => {
      const action: TimedTextTrackLanguageChoicesGet = {
        jwt: 'some token',
        type: 'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET',
      };

      const gen = getTimedTextTrackLanguageChoices(action);
      expect(gen.next().value).toEqual(select(selector));

      expect(gen.next(requestStatus.FAILURE).value).toEqual(cancel());
    });
  });

  describe('getTimedTextTrackLanguageChoicesSaga()', () => {
    it('calls takeLeading function', () => {
      const gen = getTimedTextTrackLanguageChoicesSaga();

      expect(gen.next().value).toEqual(
        takeLeading(
          'TIMED_TEXT_TRACK_LANGUAGE_CHOICES_GET',
          getTimedTextTrackLanguageChoices,
        ),
      );
    });
  });
});

import fetchMock from 'fetch-mock';

import { getTimedTextTrackLanguageChoices } from './getTimedTextTrackLanguageChoices';

describe('sideEffects/getTimedTextTrackLanguageOptions', () => {
  afterEach(fetchMock.restore);

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
    const languageChoices = await getTimedTextTrackLanguageChoices(
      'some token',
    );

    expect(languageChoices).toEqual([
      { label: 'English', value: 'en' },
      { label: 'French', value: 'fr' },
    ]);
    expect(fetchMock.lastCall()[1].headers).toEqual({
      Authorization: 'Bearer some token',
    });
  });

  it('throws when it fails to get the route options (request failure)', async () => {
    fetchMock.mock(
      '/api/timedtexttracks/',
      Promise.reject(new Error('Failed to perform the request')),
      { method: 'OPTIONS' },
    );

    await expect(
      getTimedTextTrackLanguageChoices('some token'),
    ).rejects.toThrowError('Failed to perform the request');
  });

  it('throws when it fails to get the route options (API error)', async () => {
    fetchMock.mock('/api/timedtexttracks/', 400, { method: 'OPTIONS' });

    await expect(
      getTimedTextTrackLanguageChoices('some token'),
    ).rejects.toThrowError('Failed to get /api/timedtexttracks/');
  });
});

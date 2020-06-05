import fetchMock from 'fetch-mock';

import { createTimedTextTrack } from '.';
import { timedTextMode } from '../../../types/tracks';

jest.mock('../../appData', () => ({
  appData: { jwt: 'some token' },
}));

describe('sideEffects/createTimedTextTrack()', () => {
  afterEach(() => fetchMock.restore());

  it('creates a new timedtexttrack and returns its id', async () => {
    fetchMock.mock('/api/timedtexttracks/', {
      id: '42',
      language: 'en',
      mode: 'st',
    });

    const track = await createTimedTextTrack('en', timedTextMode.SUBTITLE);
    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(track).toEqual({ id: '42', language: 'en', mode: 'st' });
    expect(fetchArgs.body).toEqual(
      JSON.stringify({ language: 'en', mode: 'st' }),
    );
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
    });
    expect(fetchArgs.method).toEqual('POST');
  });

  it('throws when it fails to create the timedtexttrack (request failure)', async () => {
    fetchMock.mock(
      '/api/timedtexttracks/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      createTimedTextTrack('en', timedTextMode.SUBTITLE),
    ).rejects.toThrowError('Failed to perform the request');
  });

  it('throws when it fails to create the timedtexttrack (API error)', async () => {
    fetchMock.mock('/api/timedtexttracks/', 400);

    await expect(
      createTimedTextTrack('en', timedTextMode.SUBTITLE),
    ).rejects.toThrowError(
      'Failed to create a new TimedTextTrack with en, st: 400.',
    );
  });
});

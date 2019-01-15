import fetchMock from 'fetch-mock';

import { getTimedTextTrackList } from './getTimedTextTrackList';

describe('sideEffects/getTimedTextTrackList', () => {
  afterEach(fetchMock.restore);

  it('gets the list of timedtexttracks and returns it', async () => {
    fetchMock.mock(
      '/api/timedtexttracks/',
      JSON.stringify([{ id: '42' }, { id: '43' }, { id: '44' }]),
    );
    const timedtexttracks = await getTimedTextTrackList('some token');

    expect(timedtexttracks).toEqual([{ id: '42' }, { id: '43' }, { id: '44' }]);
    expect(fetchMock.lastCall()[1].headers).toEqual({
      Authorization: 'Bearer some token',
    });
  });

  it('throws when it fails to get the list of timedtexttracks (request failure)', async () => {
    fetchMock.mock(
      '/api/timedtexttracks/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(getTimedTextTrackList('some token')).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to get the list of timedtexttracks (API error)', async () => {
    fetchMock.mock('/api/timedtexttracks/', 401);

    await expect(getTimedTextTrackList('some token')).rejects.toThrowError(
      'Failed to get timedtexttracks list.',
    );
  });
});

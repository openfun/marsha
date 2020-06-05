import fetchMock from 'fetch-mock';

import { deleteTimedTextTrack } from '.';
import { TimedText } from '../../../types/tracks';

jest.mock('../../appData', () => ({ appData: { jwt: 'some token' } }));

describe('sideEffects/deleteTimedTextTrack', () => {
  afterEach(() => fetchMock.restore());

  it('issues a DELETE request for the relevant timedtexttrack', async () => {
    fetchMock.mock('/api/timedtexttracks/42/', 204, { method: 'DELETE' });
    const response = await deleteTimedTextTrack({
      id: '42',
    } as TimedText);

    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
    });
    expect(response).toBe(true);
  });

  it('throws when it fails to delete the track (request failure)', async () => {
    fetchMock.mock(
      '/api/timedtexttracks/42/',
      Promise.reject(new Error('Failed to perform the request')),
      { method: 'DELETE' },
    );

    await expect(
      deleteTimedTextTrack({ id: '42' } as TimedText),
    ).rejects.toThrowError('Failed to perform the request');
  });

  it('throws when it fails to delete the track (API error)', async () => {
    fetchMock.mock('/api/timedtexttracks/42/', 403, { method: 'DELETE' });

    await expect(
      deleteTimedTextTrack({ id: '42' } as TimedText),
    ).rejects.toThrowError('Failed to delete timedtexttracks/42.');
  });
});

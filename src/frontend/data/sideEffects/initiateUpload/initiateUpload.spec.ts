import fetchMock from 'fetch-mock';

import { modelName } from '../../../types/models';
import { initiateUpload } from './initiateUpload';

describe('sideEffects/initiateUpload', () => {
  afterEach(fetchMock.restore);

  it('makes a POST request on the initiate-upload route & returns the policy', async () => {
    fetchMock.mock(
      '/api/videos/42/initiate-upload/',
      JSON.stringify({ some: 'policy' }),
      { method: 'POST' },
    );
    const policy = await initiateUpload('some token', modelName.VIDEOS, '42');

    expect(policy).toEqual({ some: 'policy' });
    expect(fetchMock.lastCall()[1].headers).toEqual({
      Authorization: 'Bearer some token',
    });
  });

  it('throws when it fails to trigger the initiate-upload (request failure)', async () => {
    fetchMock.mock(
      '/api/videos/42/initiate-upload/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      initiateUpload('some token', modelName.VIDEOS, '42'),
    ).rejects.toThrowError('Failed to perform the request');
  });

  it('throws when it fails to trigger the initiate-upload (API error)', async () => {
    fetchMock.mock('/api/videos/42/initiate-upload/', 400);

    await expect(
      initiateUpload('some token', modelName.VIDEOS, '42'),
    ).rejects.toThrowError(
      'Failed to trigger initiate-upload on the API for videos/42.',
    );
  });
});

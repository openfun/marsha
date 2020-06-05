import fetchMock from 'fetch-mock';

import { initiateUpload } from '.';
import { modelName } from '../../../types/models';

jest.mock('../../appData', () => ({ appData: { jwt: 'some token' } }));

describe('sideEffects/initiateUpload', () => {
  afterEach(() => fetchMock.restore());

  it('makes a POST request on the initiate-upload route & returns the policy', async () => {
    fetchMock.mock(
      '/api/videos/42/initiate-upload/',
      JSON.stringify({ some: 'policy' }),
      { method: 'POST' },
    );
    const policy = await initiateUpload(
      modelName.VIDEOS,
      '42',
      'foo.pdf',
      'application/pdf',
    );

    expect(policy).toEqual({ some: 'policy' });
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
    });
  });

  it('throws when it fails to trigger the initiate-upload (request failure)', async () => {
    fetchMock.mock(
      '/api/videos/42/initiate-upload/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      initiateUpload(modelName.VIDEOS, '42', 'foo.pdf', 'application/pdf'),
    ).rejects.toThrowError('Failed to perform the request');
  });

  it('throws when it fails to trigger the initiate-upload (API error)', async () => {
    fetchMock.mock('/api/videos/42/initiate-upload/', 400);

    await expect(
      initiateUpload(modelName.VIDEOS, '42', 'foo.pdf', 'application/pdf'),
    ).rejects.toThrowError(
      'Failed to trigger initiate-upload on the API for videos/42.',
    );
  });
});

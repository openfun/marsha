import fetchMock from 'fetch-mock';

import { useJwt } from 'hooks/stores/useJwt';
import { modelName } from 'types/models';

import { initiateUpload } from '.';

describe('sideEffects/initiateUpload', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

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
      10,
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
      initiateUpload(modelName.VIDEOS, '42', 'foo.pdf', 'application/pdf', 10),
    ).rejects.toThrow('Failed to perform the request');
  });

  it('throws when it fails to trigger the initiate-upload (API error)', async () => {
    fetchMock.mock('/api/videos/42/initiate-upload/', 400);
    let thrownError;
    try {
      await initiateUpload(
        modelName.VIDEOS,
        '42',
        'foo.pdf',
        'application/pdf',
        10,
      );
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toEqual({
      type: 'ApiError',
      data: {
        message: 'Failed to trigger initiate-upload on the API for videos/42.',
      },
    });
  });

  it('throws when it fails to trigger the initiate-upload (Size Error)', async () => {
    fetchMock.mock(
      '/api/videos/42/initiate-upload/',
      Promise.reject({
        type: 'SizeError',
        data: {
          size: 'file too large, max size allowed is 1Gb',
        },
      }),
    );

    let thrownError;
    try {
      await initiateUpload(
        modelName.VIDEOS,
        '42',
        'foo.pdf',
        'application/pdf',
        10,
      );
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toEqual({
      type: 'SizeError',
      data: {
        size: 'file too large, max size allowed is 1Gb',
      },
    });
  });
});

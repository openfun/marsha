import fetchMock from 'fetch-mock';
import { modelName, uploadState, useJwt } from 'lib-components';
import {
  sharedLiveMediaMockFactory,
  videoMockFactory,
} from 'lib-components/tests';

import { sharedLiveMediaUploadEnded } from '.';

describe('sideEffects/sharedLiveMediaUploadEnded', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  const video = videoMockFactory();

  const sharedLiveMedia = sharedLiveMediaMockFactory({
    upload_state: uploadState.READY,
    video: video.id,
  });

  it('makes a POST request on the upload-ended route & returns the updated sharedLiveMedia', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/${modelName.SHAREDLIVEMEDIAS}/${sharedLiveMedia.id}/upload-ended/`,
      {
        ...sharedLiveMedia,
        upload_state: uploadState.PROCESSING,
      },
      { method: 'POST' },
    );
    const updatedSharedLiveMedia = await sharedLiveMediaUploadEnded(
      video.id,
      sharedLiveMedia.id,
      `tmp/${video.id}/sharedlivemedia/${sharedLiveMedia.id}/56456454`,
    );

    expect(updatedSharedLiveMedia).toEqual({
      ...sharedLiveMedia,
      upload_state: uploadState.PROCESSING,
    });
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
      'Accept-Language': 'en',
    });
  });

  it('throws when it fails to trigger the upload-ended (request failure)', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/${modelName.SHAREDLIVEMEDIAS}/${sharedLiveMedia.id}/upload-ended/`,
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      sharedLiveMediaUploadEnded(
        video.id,
        sharedLiveMedia.id,
        `tmp/${video.id}/sharedlivemedia/${sharedLiveMedia.id}/56456454`,
      ),
    ).rejects.toThrow('Failed to perform the request');
  });

  it('throws when it fails to trigger the upload-ended (API error)', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/${modelName.SHAREDLIVEMEDIAS}/${sharedLiveMedia.id}/upload-ended/`,
      400,
    );

    await expect(
      sharedLiveMediaUploadEnded(
        video.id,
        sharedLiveMedia.id,
        `tmp/${video.id}/sharedlivemedia/${sharedLiveMedia.id}/56456454`,
      ),
    ).rejects.toThrow(
      `Failed to end the shared live media upload for shared live media ${sharedLiveMedia.id}.`,
    );
  });
});

import { timedTextMockFactory, videoMockFactory } from '@lib-components/tests';
import fetchMock from 'fetch-mock';
import { modelName, uploadState, useJwt } from 'lib-components';

import { timedTextTrackUploadEnded } from '.';

describe('sideEffects/timedTextTrackUploadEnded', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  const video = videoMockFactory();

  const timedText = timedTextMockFactory({
    upload_state: uploadState.READY,
    video: video.id,
  });

  it('makes a POST request on the upload-ended route & returns the updated timedText', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/${modelName.TIMEDTEXTTRACKS}/${timedText.id}/upload-ended/`,
      {
        ...timedText,
        upload_state: uploadState.PROCESSING,
      },
      { method: 'POST' },
    );
    const updatedTimedText = await timedTextTrackUploadEnded(
      video.id,
      timedText.id,
      `tmp/${video.id}/sharedlivemedia/${timedText.id}/56456454`,
    );

    expect(updatedTimedText).toEqual({
      ...timedText,
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
      `/api/videos/${video.id}/${modelName.TIMEDTEXTTRACKS}/${timedText.id}/upload-ended/`,
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      timedTextTrackUploadEnded(
        video.id,
        timedText.id,
        `tmp/${video.id}/sharedlivemedia/${timedText.id}/56456454`,
      ),
    ).rejects.toThrow('Failed to perform the request');
  });

  it('throws when it fails to trigger the upload-ended (API error)', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/${modelName.TIMEDTEXTTRACKS}/${timedText.id}/upload-ended/`,
      400,
    );

    await expect(
      timedTextTrackUploadEnded(
        video.id,
        timedText.id,
        `tmp/${video.id}/sharedlivemedia/${timedText.id}/56456454`,
      ),
    ).rejects.toThrow(
      `Failed to end the timed text track upload for timed text track ${timedText.id}.`,
    );
  });
});

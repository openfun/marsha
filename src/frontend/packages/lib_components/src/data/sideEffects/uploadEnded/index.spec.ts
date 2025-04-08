import fetchMock from 'fetch-mock';
import {
  modelName,
  uploadState,
  uploadableModelName,
  useJwt,
} from 'lib-components';
import {
  documentMockFactory,
  timedTextMockFactory,
  videoMockFactory,
} from 'lib-components/tests';

import { uploadEnded } from '.';

describe('sideEffects/uploadEnded', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  const video = videoMockFactory({
    upload_state: uploadState.READY,
  });

  const timedText = timedTextMockFactory({
    upload_state: uploadState.READY,
    video: video.id,
  });

  const document = documentMockFactory({
    upload_state: uploadState.READY,
  });

  it('makes a POST request on the upload-ended route & returns the updated object for simple path', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/upload-ended/`,
      {
        ...video,
        upload_state: uploadState.PROCESSING,
      },
      { method: 'POST' },
    );

    const updatedVideo = await uploadEnded<typeof video>(
      modelName.VIDEOS,
      video.id,
      `tmp/${video.id}/video/56456454`,
    );

    expect(updatedVideo).toEqual({
      ...video,
      upload_state: uploadState.PROCESSING,
    });

    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer some token',
      'Content-Type': 'application/json',
      'Accept-Language': 'en',
    });

    expect(fetchMock.lastCall()![1]!.body).toEqual(
      JSON.stringify({ file_key: `tmp/${video.id}/video/56456454` }),
    );
  });

  it('makes a POST request on the upload-ended route with parent path', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/${modelName.TIMEDTEXTTRACKS}/${timedText.id}/upload-ended/`,
      {
        ...timedText,
        upload_state: uploadState.PROCESSING,
      },
      { method: 'POST' },
    );

    const updatedTimedText = await uploadEnded<typeof video>(
      modelName.TIMEDTEXTTRACKS,
      timedText.id,
      `tmp/${video.id}/video/timedtexttracks/${timedText.id}/56456454`,
      video.id,
    );

    expect(updatedTimedText).toEqual({
      ...timedText,
      upload_state: uploadState.PROCESSING,
    });

    expect(fetchMock.lastUrl()).toEqual(
      `/api/videos/${video.id}/timedtexttracks/${timedText.id}/upload-ended/`,
    );
  });

  it('throws when it fails to trigger the upload-ended (request failure)', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/upload-ended/`,
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(
      uploadEnded(
        modelName.VIDEOS as uploadableModelName,
        video.id,
        `tmp/${video.id}/video/56456454`,
      ),
    ).rejects.toThrow('Failed to perform the request');
  });

  it('throws when it fails to trigger the upload-ended (API error)', async () => {
    fetchMock.mock(`/api/videos/${video.id}/upload-ended/`, 400);

    await expect(
      uploadEnded(
        modelName.VIDEOS as uploadableModelName,
        video.id,
        `tmp/${video.id}/video/56456454`,
      ),
    ).rejects.toThrow(`Failed to end the upload for videos/${video.id}.`);
  });

  it('works with different object types', async () => {
    fetchMock.mock(
      `/api/documents/${document.id}/upload-ended/`,
      {
        ...document,
        upload_state: uploadState.PROCESSING,
      },
      { method: 'POST' },
    );

    const updatedDocument = await uploadEnded(
      modelName.DOCUMENTS,
      document.id,
      `document/${document.id}/987654`,
    );

    expect(updatedDocument).toEqual({
      ...document,
      upload_state: uploadState.PROCESSING,
    });

    expect(fetchMock.lastUrl()).toEqual(
      `/api/documents/${document.id}/upload-ended/`,
    );
  });
});

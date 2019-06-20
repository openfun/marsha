import fetchMock from 'fetch-mock';
import xhrMock from 'xhr-mock';

import { modelName } from '../../../types/models';
import { timedTextMode, uploadState, Video } from '../../../types/tracks';
import { upload } from './';

jest.mock('../../appData', () => ({ appData: { jwt: 'foo' } }));

describe('upload', () => {
  const object = {
    description: 'Some description',
    id: 'video-id',
    is_ready_to_play: true,
    show_download: false,
    thumbnail: null,
    timed_text_tracks: [
      {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_play: true,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-1.vtt',
      },
      {
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_play: false,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-2.vtt',
      },
      {
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_play: true,
        language: 'en',
        mode: timedTextMode.CLOSED_CAPTIONING,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-3.vtt',
      },
      {
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_play: true,
        language: 'fr',
        mode: timedTextMode.TRANSCRIPT,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-4.vtt',
      },
    ],
    title: 'Some title',
    upload_state: 'pending',
    urls: {
      manifests: {
        dash: 'https://example.com/dash.mpd',
        hls: 'https://example.com/hls.m3u8',
      },
      mp4: {
        144: 'https://example.com/144p.mp4',
        1080: 'https://example.com/1080p.mp4',
      },
      thumbnails: {
        720: 'https://example.com/144p.jpg',
      },
    },
  } as Video;

  const updateObject = jest.fn();
  const setStatus = jest.fn();
  const notifyObjectUploadProgress = jest.fn();
  const objectType = modelName.VIDEOS;

  beforeEach(jest.resetAllMocks);
  beforeEach(() => xhrMock.setup());

  afterEach(fetchMock.restore);
  afterEach(() => xhrMock.teardown());

  it('gets the policy from the API and uses it to upload the file', async () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    fetchMock.mock(
      '/api/videos/video-id/initiate-upload/',
      {
        bucket: 'dev',
        s3_endpoint: 's3.aws.example.com',
      },
      { method: 'POST' },
    );

    xhrMock.post('https://s3.aws.example.com/dev', {
      body: 'form data body',
      status: 204,
    });

    await upload(
      updateObject,
      setStatus,
      notifyObjectUploadProgress,
      objectType,
      object,
    )(file);

    expect(
      fetchMock.calls('/api/videos/video-id/initiate-upload/', {
        method: 'POST',
      }),
    ).toHaveLength(1);
    expect(setStatus).toHaveBeenCalledWith('uploading');
    expect(updateObject).toHaveBeenCalledWith({
      ...object,
      upload_state: uploadState.UPLOADING,
    });
    expect(updateObject).toHaveBeenCalledWith({
      ...object,
      upload_state: uploadState.PROCESSING,
    });
  });

  it('reports the error and does not upload to AWS when it fails to create an initiate upload', async () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    fetchMock.mock('/api/videos/video-id/initiate-upload/', 400, {
      method: 'POST',
    });

    xhrMock.post('https://s3.aws.example.com/dev', () => {
      throw new Error('upload file should not be called');
    });

    await upload(
      updateObject,
      setStatus,
      notifyObjectUploadProgress,
      objectType,
      object,
    )(file);

    expect(
      fetchMock.calls('/api/videos/video-id/initiate-upload/', {
        method: 'POST',
      }),
    ).toHaveLength(1);
    expect(setStatus).toHaveBeenCalledWith('policy_error');
  });

  it('marks the object with an error state when it fails to upload the file', async () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    fetchMock.mock(
      '/api/videos/video-id/initiate-upload/',
      {
        bucket: 'dev',
        s3_endpoint: 's3.aws.example.com',
      },
      { method: 'POST' },
    );

    xhrMock.post('https://s3.aws.example.com/dev', {
      status: 400,
    });

    await upload(
      updateObject,
      setStatus,
      notifyObjectUploadProgress,
      objectType,
      object,
    )(file);

    expect(
      fetchMock.calls(
        `/api/${modelName.VIDEOS}/${object.id}/initiate-upload/`,
        {
          method: 'POST',
        },
      ),
    ).toHaveLength(1);
    expect(setStatus).toHaveBeenCalledWith('uploading');
    expect(updateObject).toHaveBeenCalledWith({
      ...object,
      upload_state: uploadState.UPLOADING,
    });
    expect(updateObject).toHaveBeenCalledWith({
      ...object,
      upload_state: uploadState.ERROR,
    });
  });

  it('does not execute the upload function if there is no file', async () => {
    fetchMock.mock(
      '/api/videos/video-id/initiate-upload/',
      {
        bucket: 'dev',
        s3_endpoint: 's3.aws.example.com',
      },
      { method: 'POST' },
    );

    await upload(
      updateObject,
      setStatus,
      notifyObjectUploadProgress,
      objectType,
      object,
    )(undefined);

    expect(
      fetchMock.calls(
        `/api/${modelName.VIDEOS}/${object.id}/initiate-upload/`,
        {
          method: 'POST',
        },
      ),
    ).toHaveLength(0);
    expect(setStatus).not.toHaveBeenCalled();
    expect(updateObject).not.toHaveBeenCalled();
  });

  it('sets the status to not found and stops the execution if there is no object', async () => {
    fetchMock.mock(
      '/api/videos/video-id/initiate-upload/',
      {
        bucket: 'dev',
        s3_endpoint: 's3.aws.example.com',
      },
      { method: 'POST' },
    );

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    await upload(
      updateObject,
      setStatus,
      notifyObjectUploadProgress,
      objectType,
      undefined,
    )(file);

    expect(
      fetchMock.calls('/api/videos/video-id/initiate-upload/', {
        method: 'POST',
      }),
    ).toHaveLength(0);
    expect(setStatus).toHaveBeenCalledWith('not_found_error');
    expect(updateObject).not.toHaveBeenCalled();
  });
});

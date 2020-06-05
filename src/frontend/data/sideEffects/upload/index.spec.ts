import fetchMock from 'fetch-mock';
import xhrMock from 'xhr-mock';

import { modelName } from '../../../types/models';
import {
  Thumbnail,
  timedTextMode,
  uploadState,
  Video,
} from '../../../types/tracks';
import { jestMockOf } from '../../../utils/types';
import { addResource } from '../../stores/generics';
import { upload } from './';

jest.mock('../../appData', () => ({ appData: { jwt: 'foo' } }));

jest.mock('../../stores/generics', () => ({
  addResource: jest.fn(),
}));
const mockAddResource = addResource as jestMockOf<typeof addResource>;

describe('upload', () => {
  const object = {
    description: 'Some description',
    id: 'video-id',
    is_ready_to_show: true,
    show_download: false,
    thumbnail: null,
    timed_text_tracks: [
      {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-1.vtt',
      },
      {
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_show: false,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-2.vtt',
      },
      {
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_show: true,
        language: 'en',
        mode: timedTextMode.CLOSED_CAPTIONING,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-3.vtt',
      },
      {
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_show: true,
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

  const setStatus = jest.fn();
  const notifyObjectUploadProgress = jest.fn();
  const objectType = modelName.VIDEOS;

  beforeEach(jest.resetAllMocks);
  beforeEach(() => xhrMock.setup());

  afterEach(() => fetchMock.restore());
  afterEach(() => xhrMock.teardown());

  it('gets the policy from the API and uses it to upload the file', async () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    fetchMock.mock(
      '/api/videos/video-id/initiate-upload/',
      {
        fields: {
          key: 'foo',
        },
        url: 'https://s3.aws.example.com/',
      },
      { method: 'POST' },
    );

    fetchMock.mock('/api/videos/video-id/', 200, { method: 'PUT' });

    xhrMock.post('https://s3.aws.example.com/', {
      body: 'form data body',
      status: 204,
    });

    await upload(
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
    expect(mockAddResource).toHaveBeenCalledWith(objectType, {
      ...object,
      upload_state: uploadState.UPLOADING,
    });
    expect(mockAddResource).toHaveBeenCalledWith(objectType, {
      ...object,
      title: file.name,
      upload_state: uploadState.PROCESSING,
    });
    expect(fetchMock.called('/api/videos/video-id/', { method: 'PUT' })).toBe(
      true,
    );
    const call = fetchMock.lastCall('/api/videos/video-id/', { method: 'PUT' });
    expect(JSON.parse(call![1]!.body as string)).toEqual({
      ...object,
      title: file.name,
    });
  });

  it('gets the policy and upload the file for an object without title', async () => {
    const thumbnail: Thumbnail = {
      active_stamp: null,
      id: 'thumb1',
      is_ready_to_show: false,
      upload_state: uploadState.PENDING,
      urls: {
        144: 'https://example.com/144p.jpg',
        240: 'https://example.com/240p.jpg',
        480: 'https://example.com/480p.jpg',
        720: 'https://example.com/720p.jpg',
        1080: 'https://example.com/1080p.jpg',
      },
      video: 'video-id',
    };

    const file = new File(['(⌐□_□)'], 'thumbnail.png', { type: 'image/png' });

    fetchMock.mock(
      '/api/thumbnails/thumb1/initiate-upload/',
      {
        fields: {
          key: 'foo',
        },
        url: 'https://s3.aws.example.com/',
      },
      { method: 'POST' },
    );

    fetchMock.mock('/api/thumbnails/thumb1/', 200, { method: 'PUT' });

    xhrMock.post('https://s3.aws.example.com/', {
      body: 'form data body',
      status: 204,
    });

    await upload(
      setStatus,
      notifyObjectUploadProgress,
      modelName.THUMBNAILS,
      thumbnail,
    )(file);

    expect(
      fetchMock.called('/api/thumbnails/thumb1/initiate-upload/', {
        method: 'POST',
      }),
    ).toBe(true);
    expect(setStatus).toHaveBeenCalledWith('uploading');
    expect(mockAddResource).toHaveBeenCalledWith(modelName.THUMBNAILS, {
      ...thumbnail,
      upload_state: uploadState.UPLOADING,
    });
    expect(mockAddResource).toHaveBeenCalledWith(modelName.THUMBNAILS, {
      ...thumbnail,
      upload_state: uploadState.PROCESSING,
    });
    expect(fetchMock.called('/api/thumbnails/thumb1/', { method: 'PUT' })).toBe(
      false,
    );
  });

  it('reports the error and does not upload to AWS when it fails to create an initiate upload', async () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    fetchMock.mock('/api/videos/video-id/initiate-upload/', 400, {
      method: 'POST',
    });

    xhrMock.post('https://s3.aws.example.com/', () => {
      throw new Error('upload file should not be called');
    });

    await upload(
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
        fields: {
          key: 'foo',
        },
        url: 'https://s3.aws.example.com/',
      },
      { method: 'POST' },
    );

    xhrMock.post('https://s3.aws.example.com/', {
      status: 400,
    });

    await upload(
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
    expect(mockAddResource).toHaveBeenCalledWith(objectType, {
      ...object,
      upload_state: uploadState.UPLOADING,
    });
    expect(mockAddResource).toHaveBeenCalledWith(objectType, {
      ...object,
      upload_state: uploadState.ERROR,
    });
  });

  it('does not execute the upload function if there is no file', async () => {
    fetchMock.mock(
      '/api/videos/video-id/initiate-upload/',
      {
        fields: {
          key: 'foo',
        },
        url: 'https://s3.aws.example.com/',
      },
      { method: 'POST' },
    );

    await upload(
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
    expect(mockAddResource).not.toHaveBeenCalled();
  });

  it('sets the status to not found and stops the execution if there is no object', async () => {
    fetchMock.mock(
      '/api/videos/video-id/initiate-upload/',
      {
        fields: {
          key: 'foo',
        },
        url: 'https://s3.aws.example.com/',
      },
      { method: 'POST' },
    );

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    await upload(
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
    expect(mockAddResource).not.toHaveBeenCalled();
  });
});

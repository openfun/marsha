import fetchMock from 'fetch-mock';

import { updateResource } from '.';
import { modelName } from '../../../types/models';
import { Video } from '../../../types/tracks';

jest.mock('../../appData', () => ({ appData: { jwt: 'foo' } }));

describe('sideEffects/updateResource', () => {
  afterEach(() => fetchMock.restore());

  const video = {
    description: 'Some description',
    id: 'video-id',
    is_ready_to_show: true,
    show_download: false,
    title: 'Some title',
    upload_state: 'ready',
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

  it('makes a PUT request return the modified resource.', async () => {
    fetchMock.mock('/api/videos/video-id/', JSON.stringify(video), {
      method: 'PUT',
    });

    await updateResource(video, modelName.VIDEOS);

    expect(fetchMock.called()).toBe(true);
  });

  it('throws an error if the response does not return a 2xx', async () => {
    fetchMock.mock('/api/videos/video-id/', 400, { method: 'PUT' });

    await expect(updateResource(video, modelName.VIDEOS)).rejects.toThrowError(
      'Failed to update resource videos with id video-id',
    );
  });
});

import { Document } from '../../types/file';
import { uploadState, Video } from '../../types/tracks';

export const videoMockFactory = (video: Partial<Video> = {}): Video => ({
  description: '',
  has_transcript: false,
  id: '43',
  is_ready_to_show: true,
  show_download: true,
  thumbnail: null,
  timed_text_tracks: [],
  title: '',
  upload_state: uploadState.READY,
  urls: {
    manifests: {
      dash: 'https://example.com/dash',
      hls: 'https://example.com/hls',
    },
    mp4: {
      144: 'https://example.com/mp4/144',
      240: 'https://example.com/mp4/240',
      480: 'https://example.com/mp4/480',
      720: 'https://example.com/mp4/720',
      1080: 'https://example.com/mp4/1080',
    },
    thumbnails: {
      144: 'https://example.com/default_thumbnail/144',
      240: 'https://example.com/default_thumbnail/240',
      480: 'https://example.com/default_thumbnail/480',
      720: 'https://example.com/default_thumbnail/720',
      1080: 'https://example.com/default_thumbnail/1080',
    },
  },
  should_use_subtitle_as_transcript: false,
  playlist: {
    title: 'foo',
    lti_id: 'foo+context_id',
  },
  ...video,
});

export const documentMockFactory = (
  document: Partial<Document> = {},
): Document => {
  const id = document.id || '44';

  return {
    description: '',
    extension: 'pdf',
    filename: 'bar_foo.pdf',
    id,
    is_ready_to_show: true,
    show_download: true,
    title: 'foo.pdf',
    upload_state: uploadState.PROCESSING,
    url: `https://example.com/document/${id}`,
    playlist: {
      title: 'foo',
      lti_id: 'foo+context_id',
    },
    ...document,
  };
};

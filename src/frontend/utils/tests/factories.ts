import { Document } from '../../types/file';
import { liveState, uploadState, Video } from '../../types/tracks';

export const videoMockFactory = (video: Partial<Video> = {}): Video => {
  const id = video.id || '43';
  return {
    description: '',
    has_transcript: false,
    id,
    is_ready_to_show: true,
    lti_url: `https://example.com/lti/videos/${id}`,
    show_download: true,
    thumbnail: null,
    timed_text_tracks: [],
    title: '',
    upload_state: uploadState.READY,
    urls: {
      manifests: {
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
    live_state: null,
    live_info: {},
    xmpp: null,
    ...video,
  };
};

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
    lti_url: `https://example.com/lti/documents/${id}`,
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

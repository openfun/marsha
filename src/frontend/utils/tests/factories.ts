import * as faker from 'faker';
import { Document } from '../../types/file';
import { Playlist, uploadState, Video } from '../../types/tracks';

export const playlistMockFactory = (
  playlist: Partial<Playlist> = {},
): Playlist => {
  return {
    consumer_site: faker.internet.domainName(),
    created_by: null,
    duplicated_from: null,
    id: faker.datatype.string(),
    is_portable_to_playlist: faker.datatype.boolean(),
    is_portable_to_consumer_site: faker.datatype.boolean(),
    is_public: faker.datatype.boolean(),
    lti_id: faker.datatype.string(),
    organization: faker.company.companyName(),
    portable_to: [],
    title: faker.name.title(),
    users: [],
    ...playlist,
  };
};

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
    playlist: playlistMockFactory(),
    live_state: null,
    live_info: {},
    live_type: null,
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
    playlist: playlistMockFactory(),
    ...document,
  };
};

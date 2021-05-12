import * as faker from 'faker';
import { Document } from '../../types/file';
import {
  Playlist,
  Thumbnail,
  TimedText,
  timedTextMode,
  uploadState,
  Video,
} from '../../types/tracks';
import { Organization } from '../../types/Organization';
import { Nullable } from '../types';

export const organizationMockFactory = (
  organization: Partial<Organization> = {},
): Organization => {
  return {
    consumer_sites: [],
    created_on: faker.date.recent().toString(),
    id: faker.datatype.uuid(),
    name: faker.company.companyName(),
    users: [],
    ...organization,
  };
};

export const playlistMockFactory = (
  playlist: Partial<Playlist> = {},
): Playlist => {
  return {
    consumer_site: faker.internet.domainName(),
    created_by: null,
    duplicated_from: null,
    id: faker.datatype.uuid(),
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

export const thumbnailMockFactory = (
  thumbnail: Partial<Thumbnail> = {},
): Thumbnail => {
  const id = thumbnail.id || faker.datatype.uuid();
  return {
    id,
    is_ready_to_show: faker.datatype.boolean(),
    upload_state: uploadState.READY,
    urls: {
      144: 'https://example.com/default_thumbnail/144',
      240: 'https://example.com/default_thumbnail/240',
      480: 'https://example.com/default_thumbnail/480',
      720: 'https://example.com/default_thumbnail/720',
      1080: 'https://example.com/default_thumbnail/1080',
    },
    active_stamp: faker.date.past().getTime(),
    video: videoMockFactory().id,
    ...thumbnail,
  };
};

export const timedTextMockFactory = (
  timedText: Partial<TimedText> = {},
): TimedText => {
  const id = timedText.id || faker.datatype.uuid();
  return {
    id,
    active_stamp: faker.date.past().getTime(),
    is_ready_to_show: faker.datatype.boolean(),
    language: faker.datatype.string(),
    mode: timedTextMode.SUBTITLE,
    upload_state: uploadState.READY,
    source_url: faker.internet.url(),
    url: faker.internet.url(),
    video: videoMockFactory().id,
    title: faker.commerce.product(),
    ...timedText,
  };
};

export const videoMockFactory = (video: Partial<Video> = {}): Video => {
  const id = video.id || faker.datatype.uuid();
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

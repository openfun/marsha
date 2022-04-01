import * as faker from 'faker';

import { Document } from 'types/file';
import { DecodedJwt, DecodedJwtPermission, DecodedJwtUser } from 'types/jwt';
import { Organization } from 'types/Organization';
import { Participant } from 'types/Participant';
import {
  LiveSession,
  Playlist,
  PlaylistLite,
  Thumbnail,
  TimedText,
  timedTextMode,
  uploadState,
  Video,
} from 'types/tracks';

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

export const playlistLiteMockFactory = (
  playlist: Partial<PlaylistLite> = {},
): PlaylistLite => {
  return {
    id: faker.datatype.uuid(),
    lti_id: faker.datatype.string(),
    title: faker.name.title(),
    ...playlist,
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
    is_scheduled: false,
    lti_url: `https://example.com/lti/videos/${id}`,
    show_download: true,
    starting_at: null,
    thumbnail: null,
    timed_text_tracks: [],
    title: faker.lorem.words(5),
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
    participants_asking_to_join: [],
    participants_in_discussion: [],
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

export const liveSessionFactory = (
  liveSession: Partial<LiveSession> = {},
): LiveSession => {
  const id = liveSession.id || faker.datatype.uuid();

  return {
    anonymous_id: null,
    consumer_site: null,
    display_name: null,
    email: null,
    id,
    is_registered: faker.datatype.boolean(),
    live_attendance: null,
    lti_id: null,
    lti_user_id: null,
    should_send_reminders: faker.datatype.boolean(),
    username: null,
    video: videoMockFactory().id,
    ...liveSession,
  };
};

export const participantMockFactory = (
  participant: Partial<Participant> = {},
): Participant => {
  return {
    id: faker.datatype.uuid(),
    name: faker.name.findName(),
    ...participant,
  };
};

export const publicTokenMockFactory = (
  token: Partial<DecodedJwt> = {},
  permission: Partial<DecodedJwtPermission> = {},
): DecodedJwt => {
  return {
    locale: 'en',
    maintenance: false,
    permissions: {
      can_access_dashboard: false,
      can_update: false,
      ...permission,
    },
    resource_id: faker.datatype.uuid(),
    roles: ['none'],
    session_id: faker.datatype.uuid(),
    ...token,
  };
};

export const ltiStudentTokenMockFactory = (
  token: Partial<DecodedJwt> = {},
  user: Partial<DecodedJwtUser> = {},
  permission: Partial<DecodedJwtPermission> = {},
): DecodedJwt => {
  return {
    ...publicTokenMockFactory(token, permission),
    context_id: faker.lorem.sentence(2),
    consumer_site: faker.datatype.uuid(),
    roles: ['student'],
    user: {
      email: faker.internet.email(),
      id: faker.datatype.uuid(),
      username: faker.internet.userName(),
      user_fullname: faker.name.findName(),
      ...user,
    },
    ...token,
  };
};

export const ltiInstructorTokenMockFactory = (
  token: Partial<DecodedJwt> = {},
  user: Partial<DecodedJwtUser> = {},
  permission: Partial<DecodedJwtPermission> = {},
): DecodedJwt => {
  return {
    ...ltiStudentTokenMockFactory(token, user, permission),
    permissions: {
      can_access_dashboard: true,
      can_update: true,
      ...permission,
    },
    roles: ['instructor'],
    ...token,
  };
};

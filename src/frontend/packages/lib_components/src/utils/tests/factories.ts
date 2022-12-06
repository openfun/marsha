import * as faker from 'faker';

import { PortabilityConfig } from 'types/AppData';
import { Organization } from 'types/Organization';
import { Participant } from 'types/Participant';
import {
  PortabilityRequest,
  PortabilityRequestState,
} from 'types/PortabilityRequest';
import { DecodedJwtPermission } from 'types/ResourceContext';
import { Document } from 'types/file';
import { DecodedJwt, DecodedJwtUser } from 'types/jwt';
import {
  JoinMode,
  Live,
  LiveModeType,
  LiveAttendance,
  LiveSession,
  liveState,
  Playlist,
  PlaylistLite,
  SharedLiveMedia,
  Thumbnail,
  TimedText,
  timedTextMode,
  uploadState,
  Video,
} from 'types/tracks';

import { User } from '../../types';
import { ConsumerSite } from '../../types/ConsumerSite';

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

export const consumerSiteMockFactory = (
  consumerSite: Partial<ConsumerSite> = {},
): ConsumerSite => {
  return {
    id: faker.datatype.uuid(),
    name: faker.company.companyName(),
    domain: faker.internet.domainName(),
    ...consumerSite,
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
    consumer_site: consumerSiteMockFactory(),
    created_by: null,
    duplicated_from: null,
    id: faker.datatype.uuid(),
    is_portable_to_playlist: faker.datatype.boolean(),
    is_portable_to_consumer_site: faker.datatype.boolean(),
    is_public: faker.datatype.boolean(),
    lti_id: faker.datatype.string(),
    organization: {
      id: faker.datatype.uuid(),
      name: faker.company.companyName(),
    },
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
    active_shared_live_media: null,
    active_shared_live_media_page: null,
    allow_recording: true,
    description: '',
    has_transcript: false,
    id,
    is_ready_to_show: true,
    is_scheduled: false,
    has_chat: true,
    is_public: false,
    join_mode: JoinMode.APPROVAL,
    lti_url: `https://example.com/lti/videos/${id}`,
    license: 'All rights reserved',
    show_download: true,
    starting_at: null,
    estimated_duration: null,
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
    shared_live_medias: [],
    ...video,
  };
};

export const liveMockFactory = (live: Partial<Live> = {}): Live => {
  return {
    ...videoMockFactory(live),
    live_state: liveState.IDLE,
    live_type: LiveModeType.JITSI,
    ...live,
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

export const liveAttendanceFactory = (
  liveAttendance: Partial<LiveAttendance> = {},
): LiveAttendance => {
  const id = liveAttendance.id || faker.datatype.uuid();

  return {
    display_name: null,
    id,
    is_registered: faker.datatype.boolean(),
    live_attendance: {
      [Date.now()]: {
        fullScreen: true,
        muted: false,
        player_timer: 0.12,
        playing: false,
        timestamp: Date.now(),
        volume: 0.16,
      },
      [Date.now() + 100]: {
        fullScreen: false,
        muted: true,
        player_timer: 0.12,
        playing: true,
        timestamp: Date.now() + 100,
        volume: 0.16,
      },
    },
    ...liveAttendance,
  };
};

export const liveSessionFactory = (
  liveSession: Partial<LiveSession> = {},
): LiveSession => {
  const id = liveSession.id || faker.datatype.uuid();
  const languages = ['en', 'fr'];

  return {
    anonymous_id: null,
    consumer_site: null,
    display_name: null,
    email: null,
    id,
    is_registered: faker.datatype.boolean(),
    language: languages[Math.floor(Math.random() * languages.length)],
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

export const sharedLiveMediaMockFactory = (
  sharedLiveMedia: Partial<SharedLiveMedia> = {},
): SharedLiveMedia => {
  const id = sharedLiveMedia.id || faker.datatype.uuid();
  return {
    id,
    active_stamp: faker.date.past().getTime().valueOf(),
    filename: 'shared_live_media.pdf',
    is_ready_to_show: true,
    nb_pages: 5,
    show_download: true,
    title: 'share_live_media_title',
    upload_state: uploadState.READY,
    urls: {
      media: `https://example.com/sharedLiveMedia/${id}`,
      pages: {
        1: `https://example.com/sharedLiveMedia/${id}/1`,
        2: `https://example.com/sharedLiveMedia/${id}/2`,
        3: `https://example.com/sharedLiveMedia/${id}/3`,
        4: `https://example.com/sharedLiveMedia/${id}/4`,
        5: `https://example.com/sharedLiveMedia/${id}/5`,
      },
    },
    video: faker.datatype.uuid(),
    ...sharedLiveMedia,
  };
};

export const PortabilityConfigMockFactory = (
  portabilityConfig: Partial<PortabilityConfig> = {},
): PortabilityConfig => {
  return {
    resource_id: faker.datatype.uuid(),
    redirect_to: faker.internet.url(),
    for_playlist_id: faker.datatype.uuid(),
    portability_request_exists: false,
    ...portabilityConfig,
  };
};

export const portabilityRequestMockFactory = (
  portabilityRequest: Partial<PortabilityRequest> = {},
): PortabilityRequest => {
  return {
    id: faker.datatype.uuid(),
    for_playlist: playlistLiteMockFactory(),
    from_playlist: playlistLiteMockFactory(),
    from_lti_consumer_site: consumerSiteMockFactory(),
    from_lti_user_id: faker.datatype.uuid(),
    state: PortabilityRequestState.PENDING,
    from_user: null,
    updated_by_user: null,
    can_accept_or_reject: true,
    ...portabilityRequest,
  };
};

export const userMockFactory = (user: Partial<User> = {}): User => {
  return {
    is_staff: false,
    is_superuser: false,
    organization_accesses: [],
    ...user,
  };
};

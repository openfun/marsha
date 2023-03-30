/* eslint-disable @typescript-eslint/no-explicit-any */
import { Nullable } from 'lib-common';

import { Document } from '@lib-components/types/file';
import { modelName } from '@lib-components/types/models';
import {
  AppDataRessource,
  Live,
  Playlist,
  Resource,
  Video,
} from '@lib-components/types/tracks';

export enum appState {
  ERROR = 'error',
  PORTABILITY = 'portability',
  SUCCESS = 'success',
}

export enum flags {
  CLASSROOM = 'classroom',
  DEPOSIT = 'deposit',
  MARKDOWN = 'markdown',
  VIDEO = 'video',
  WEBINAR = 'webinar',
  DOCUMENT = 'document',
  SENTRY = 'sentry',
  LIVE_RAW = 'live_raw',
}

/**
 * Declare your apps here
 * App name needs to match the folder containing the app in `apps/{myAppName}/`
 */
export enum appNames {
  CLASSROOM = 'classroom',
  DEPOSIT = 'deposit',
  MARKDOWN = 'markdown',
}

export enum selectableBaseResource {
  DOCUMENT = 'document',
  VIDEO = 'video',
  WEBINAR = 'webinar',
}

export type LtiSelectResource = selectableBaseResource | appNames;

export interface PortabilityConfig {
  resource_id: string;
  redirect_to: string;
  for_playlist_id: string;
  portability_request_exists: boolean;
}

export interface AppConfig {
  attendanceDelay: number;
  state: appState;
  video?: Nullable<Video>;
  videos?: Video[];
  webinars?: Live[];
  document?: Nullable<Document>;
  documents?: Document[];
  resource?: AppDataRessource;
  resource_id?: Resource['id'];
  modelName: modelName.VIDEOS | modelName.DOCUMENTS;
  appName?: appNames;
  new_document_url?: string;
  new_video_url?: string;
  new_webinar_url?: string;
  lti_select_form_action_url?: string;
  lti_select_form_data?: {
    [key: string]: string;
  };
  sentry_dsn: Nullable<string>;
  environment: string;
  frontend: string;
  release: string;
  static: {
    svg: {
      icons: string;
    };
    img: {
      bbbBackground?: string;
      bbbLogo?: string;
      liveBackground: string;
      liveErrorBackground: string;
      marshaWhiteLogo: string;
      videoWizardBackground: string;
      errorMain: string;
    };
  };
  player?: string;
  playlist?: Playlist;
  targeted_resource?: LtiSelectResource;
  flags?: {
    [key in flags]?: boolean;
  };
  uploadPollInterval: number;
  portability?: PortabilityConfig;
  dashboardCollapsed?: boolean;
}

export interface AuthenticatedUser {
  jwt?: string;
  refresh_token?: string;
}

export type AppData = AppConfig & AuthenticatedUser;

// https://liveaspankaj.gitbooks.io/xapi-video-profile/content/statement_data_model.html

import uuid from 'uuid';
import { XAPI_ENDPOINT } from '../settings';

const ContextExtensionsDefintion: { [key: string]: string } = {
  ccSubtitleEnabled:
    'https://w3id.org/xapi/video/extensions/cc-subtitle-enabled',
  ccSubtitleLanguage: 'https://w3id.org/xapi/video/extensions/cc-subtitle-lang',
  completionTreshold:
    'https://w3id.org/xapi/video/extensions/completion-threshold',
  frameRate: 'https://w3id.org/xapi/video/extensions/frame-rate',
  fullScreen: 'https://w3id.org/xapi/video/extensions/full-screen',
  length: 'https://w3id.org/xapi/video/extensions/length',
  quality: 'https://w3id.org/xapi/video/extensions/quality',
  screenSize: 'https://w3id.org/xapi/video/extensions/screen-size',
  sessionId: 'https://w3id.org/xapi/video/extensions/session-id',
  speed: 'https://w3id.org/xapi/video/extensions/speed',
  track: 'https://w3id.org/xapi/video/extensions/track',
  userAgent: 'https://w3id.org/xapi/video/extensions/user-agent',
  videoPlaybackSize:
    'https://w3id.org/xapi/video/extensions/video-playback-size',
  volume: 'https://w3id.org/xapi/video/extensions/volume',
};

const ResultExtensionsDefinition: { [key: string]: string } = {
  playedSegment: 'https://w3id.org/xapi/video/extensions/played-segments',
  progress: 'https://w3id.og/xapi/video/extensions/progress',
  time: 'https://w3id.org/xapi/video/extensions/time',
  timeFrom: 'https://w3id.org/xapi/video/extensions/time-from',
  timeTo: 'https://w3id.org/xapi/video/extensions/time-to',
};

export const verbDefinition: { [key: string]: string } = {
  completed: 'http://adlnet.gov/expapi/verbs/completed',
  initialized: 'http://adlnet.gov/expapi/verbs/initialized',
  interacted: 'http://adlnet.gov/expapi/verbs/interacted',
  paused: 'https://w3id.org/xapi/video/verbs/paused',
  played: 'https://w3id.org/xapi/video/verbs/played',
  seeked: 'https://w3id.org/xapi/video/verbs/seeked',
  terminated: 'http://adlnet.gov/expapi/verbs/terminated',
};

export interface InitializedContextExtensions {
  length: number;
  sessionId: string;
  ccSubtitleEnabled?: boolean;
  ccSubtitleLanguage?: string;
  completionTreshold?: number;
  frameRate?: number;
  fullScreen?: boolean;
  quality?: string;
  screenSize?: string;
  videoPlaybackSize?: string;
  speed?: string;
  track?: string;
  userAgent?: string;
  volume?: number;
  [key: string]: string | boolean | number | undefined;
}

export function initialized(
  jwt: string,
  contextExtensions: InitializedContextExtensions,
): void {
  const extensions: {
    [key: string]: string | boolean | number | undefined;
  } = {};
  for (const key of Object.keys(contextExtensions)) {
    extensions[ContextExtensionsDefintion[key]] = contextExtensions[key];
  }

  const data = {
    context: {
      extensions,
    },
    id: uuid(),
    verb: {
      display: {
        'en-US': 'initialized',
      },
      id: verbDefinition.initialized,
    },
  };

  fetch(`${XAPI_ENDPOINT}`, {
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
}

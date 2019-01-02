// https://liveaspankaj.gitbooks.io/xapi-video-profile/content/statement_data_model.html

import {
  contextExtensionsKey,
  DataPayload,
  InitializedContextExtensions,
  PausedContextExtensions,
  PausedResultExtensions,
  PlayedResultExtensions,
  SeekedResultExtensions,
} from 'types/XAPI';
import uuid from 'uuid';
import { XAPI_ENDPOINT } from '../settings';

const ContextExtensionsDefintion: {
  ccSubtitleEnabled: string;
  ccSubtitleLanguage: string;
  completionTreshold: string;
  frameRate: string;
  fullScreen: string;
  length: string;
  quality: string;
  screenSize: string;
  sessionId: string;
  speed: string;
  track: string;
  userAgent: string;
  videoPlaybackSize: string;
  volume: string;
} = {
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

const ResultExtensionsDefinition: {
  playedSegment: string;
  progress: string;
  time: string;
  timeFrom: string;
  timeTo: string;
} = {
  playedSegment: 'https://w3id.org/xapi/video/extensions/played-segments',
  progress: 'https://w3id.org/xapi/video/extensions/progress',
  time: 'https://w3id.org/xapi/video/extensions/time',
  timeFrom: 'https://w3id.org/xapi/video/extensions/time-from',
  timeTo: 'https://w3id.org/xapi/video/extensions/time-to',
};

export const verbDefinition: {
  completed: string;
  initialized: string;
  interacted: string;
  paused: string;
  played: string;
  seeked: string;
  terminated: string;
} = {
  completed: 'http://adlnet.gov/expapi/verbs/completed',
  initialized: 'http://adlnet.gov/expapi/verbs/initialized',
  interacted: 'http://adlnet.gov/expapi/verbs/interacted',
  paused: 'https://w3id.org/xapi/video/verbs/paused',
  played: 'https://w3id.org/xapi/video/verbs/played',
  seeked: 'https://w3id.org/xapi/video/verbs/seeked',
  terminated: 'http://adlnet.gov/expapi/verbs/terminated',
};

export class XAPIStatement {
  static toFixed(rawNumber: number, length: number = 3): number {
    return parseFloat(rawNumber.toFixed(length));
  }

  private startSegments: number[] = [];
  private endSegments: number[] = [];
  // tslint:disable-next-line:variable-name
  private _duration: number = 0;

  constructor(private jwt: string, private sessionId: string) {}

  set duration(duration: number) {
    if (this._duration > 0) {
      throw new Error('duration is already set. You can not modify it anymore');
    }

    if (duration <= 0) {
      throw new Error('duration must be strictly positive');
    }

    this._duration = duration;
  }

  get playedSegment(): string {
    const playedSegment: string[] = [];
    for (const i in this.startSegments) {
      if (this.endSegments[i]) {
        playedSegment.push(`${this.startSegments[i]}[.]${this.endSegments[i]}`);
      } else {
        playedSegment.push(`${this.startSegments[i]}`);
      }
    }

    return playedSegment.join('[,]');
  }

  initialized(contextExtensions: InitializedContextExtensions): void {
    const extensions: {
      [key: string]: string | boolean | number | undefined;
    } = {
      [ContextExtensionsDefintion.sessionId]: this.sessionId,
    };
    for (const key of Object.keys(contextExtensions)) {
      extensions[ContextExtensionsDefintion[key as contextExtensionsKey]] =
        contextExtensions[key as contextExtensionsKey];
    }

    extensions[ContextExtensionsDefintion.sessionId] = this.sessionId;

    this.duration = contextExtensions.length;

    const data: DataPayload = {
      context: {
        extensions,
      },
      verb: {
        display: {
          'en-US': 'initialized',
        },
        id: verbDefinition.initialized,
      },
    };

    this.send(data);
  }

  played(resultExtensions: PlayedResultExtensions): void {
    const time: number = XAPIStatement.toFixed(resultExtensions.time);
    this.startSegments.push(time);
    const data: DataPayload = {
      context: {
        extensions: {
          [ContextExtensionsDefintion.sessionId]: this.sessionId,
        },
      },
      result: {
        extensions: {
          [ResultExtensionsDefinition.time]: time,
        },
      },
      verb: {
        display: {
          'en-US': 'played',
        },
        id: verbDefinition.played,
      },
    };

    this.send(data);
  }

  paused(
    contextExtensions: PausedContextExtensions,
    resultExtensions: PausedResultExtensions,
  ): void {
    const time: number = XAPIStatement.toFixed(resultExtensions.time);
    this.endSegments.push(time);
    const data: DataPayload = {
      context: {
        extensions: {
          [ContextExtensionsDefintion.sessionId]: this.sessionId,
        },
      },
      result: {
        extensions: {
          [ResultExtensionsDefinition.time]: time,
        },
      },
      verb: {
        display: {
          'en-US': 'paused',
        },
        id: verbDefinition.paused,
      },
    };

    data.result!.extensions[
      ResultExtensionsDefinition.playedSegment
    ] = this.playedSegment;
    data.result!.extensions[
      ResultExtensionsDefinition.progress
    ] = XAPIStatement.toFixed(resultExtensions.time / this._duration);

    if (contextExtensions.completionTreshold) {
      data.context!.extensions[ContextExtensionsDefintion.completionTreshold] =
        contextExtensions.completionTreshold;
    }

    this.send(data);
  }

  seeked(resultExtensions: SeekedResultExtensions): void {
    const timeFrom: number = XAPIStatement.toFixed(resultExtensions.timeFrom);
    const timeTo: number = XAPIStatement.toFixed(resultExtensions.timeTo);
    this.startSegments.push(timeFrom);
    this.endSegments.push(timeTo);
    const data: DataPayload = {
      context: {
        extensions: {
          [ContextExtensionsDefintion.sessionId]: this.sessionId,
        },
      },
      result: {
        extensions: {
          [ResultExtensionsDefinition.timeFrom]: timeFrom,
          [ResultExtensionsDefinition.timeTo]: timeTo,
          [ContextExtensionsDefintion.length]: XAPIStatement.toFixed(
            this._duration,
          ),
          [ResultExtensionsDefinition.progress]: XAPIStatement.toFixed(
            resultExtensions.timeTo / this._duration,
          ),
          [ResultExtensionsDefinition.playedSegment]: this.playedSegment,
        },
      },
      verb: {
        display: {
          'en-US': 'seeked',
        },
        id: verbDefinition.seeked,
      },
    };

    this.send(data);
  }

  private send(data: DataPayload) {
    data.id = uuid();
    data.timestamp = new Date().toISOString();
    fetch(`${XAPI_ENDPOINT}/`, {
      body: JSON.stringify(data),
      headers: {
        Authorization: `Bearer ${this.jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  }
}

// https://liveaspankaj.gitbooks.io/xapi-video-profile/content/statement_data_model.html
import { DateTime, Interval } from 'luxon';
import uuid from 'uuid';

import { XAPI_ENDPOINT } from '../settings';
import {
  CompletedContextExtensions,
  CompletedDataPlayload,
  ContextExtensionsDefintion,
  DataPayload,
  InitializedContextExtensions,
  InteractedContextExtensions,
  PausedContextExtensions,
  PausedResultExtensions,
  PlayedResultExtensions,
  ResultExtensionsDefinition,
  SeekedResultExtensions,
  TerminatedContextExtensions,
  TerminatedResultExtensions,
  VerbDefinition,
} from '../types/XAPI';
import { truncateDecimalDigits } from '../utils/truncateDecimalDigits';
import { Nullable } from '../utils/types';

export class XAPIStatement {
  // segments are saved in two different arrays
  // we need to save to follow each segments played by the user.
  // https://liveaspankaj.gitbooks.io/xapi-video-profile/content/statement_data_model.html#2545-played-segments
  private playedSegments: string = '';
  private startSegment: Nullable<number> = null;
  private duration: number = 0;
  private startedAt: Nullable<DateTime> = null;

  constructor(private jwt: string, private sessionId: string) {}

  setDuration(duration: number) {
    if (this.duration > 0) {
      throw new Error('duration is already set. You can not modify it anymore');
    }

    if (duration <= 0) {
      throw new Error('duration must be strictly positive');
    }

    this.duration = duration;
  }

  getPlayedSegment(): string {
    if (this.startSegment !== null) {
      if (this.playedSegments.length === 0) {
        return `${this.startSegment}`;
      }
      return `${this.playedSegments}[,]${this.startSegment}`;
    }

    return this.playedSegments;
  }

  initialized(contextExtensions: InitializedContextExtensions): void {
    const extensions: {
      [key: string]: string | boolean | number | undefined;
    } = {
      [ContextExtensionsDefintion.sessionId]: this.sessionId,
    };
    for (const key of Object.keys(contextExtensions)) {
      extensions[
        ContextExtensionsDefintion[key as keyof InitializedContextExtensions]
      ] = contextExtensions[key as keyof InitializedContextExtensions];
    }

    this.setDuration(contextExtensions.length);
    this.startedAt = DateTime.utc();

    const data: DataPayload = {
      context: {
        extensions,
      },
      verb: {
        display: {
          'en-US': 'initialized',
        },
        id: VerbDefinition.initialized,
      },
    };

    this.send(data);
  }

  played(resultExtensions: PlayedResultExtensions): void {
    const time: number = truncateDecimalDigits(resultExtensions.time);
    this.addStartSegment(time);
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
        id: VerbDefinition.played,
      },
    };

    this.send(data);
  }

  paused(
    contextExtensions: PausedContextExtensions,
    resultExtensions: PausedResultExtensions,
  ): void {
    const time: number = truncateDecimalDigits(resultExtensions.time);
    this.addEndSegment(time);
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
        id: VerbDefinition.paused,
      },
    };

    data.result!.extensions[
      ResultExtensionsDefinition.playedSegment
    ] = this.getPlayedSegment();
    data.result!.extensions[
      ResultExtensionsDefinition.progress
    ] = truncateDecimalDigits(resultExtensions.time / this.duration);

    if (contextExtensions.completionTreshold) {
      data.context!.extensions[ContextExtensionsDefintion.completionTreshold] =
        contextExtensions.completionTreshold;
    }

    this.send(data);
  }

  seeked(resultExtensions: SeekedResultExtensions): void {
    const timeFrom: number = truncateDecimalDigits(resultExtensions.timeFrom);
    const timeTo: number = truncateDecimalDigits(resultExtensions.timeTo);
    this.addEndSegment(timeFrom);
    this.addStartSegment(timeTo);

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
          [ContextExtensionsDefintion.length]: truncateDecimalDigits(
            this.duration,
          ),
          [ResultExtensionsDefinition.progress]: truncateDecimalDigits(
            resultExtensions.timeTo / this.duration,
          ),
          [ResultExtensionsDefinition.playedSegment]: this.getPlayedSegment(),
        },
      },
      verb: {
        display: {
          'en-US': 'seeked',
        },
        id: VerbDefinition.seeked,
      },
    };

    this.send(data);
  }

  completed(contextExtensions: CompletedContextExtensions): void {
    const time = truncateDecimalDigits(this.duration);

    const data: CompletedDataPlayload = {
      context: {
        extensions: {
          [ContextExtensionsDefintion.sessionId]: this.sessionId,
        },
      },
      result: {
        completion: true,
        duration: Interval.fromDateTimes(this.startedAt!, DateTime.utc())
          .toDuration('milliseconds')
          .toISO(),
        extensions: {
          [ResultExtensionsDefinition.time]: time,
          [ResultExtensionsDefinition.progress]: 1,
          [ResultExtensionsDefinition.playedSegment]: this.getPlayedSegment(),
        },
      },
      verb: {
        display: {
          'en-US': 'completed',
        },
        id: VerbDefinition.completed,
      },
    };

    if (contextExtensions.completionTreshold) {
      data.context!.extensions[ContextExtensionsDefintion.completionTreshold] =
        contextExtensions.completionTreshold;
    }

    this.send(data);
  }

  terminated(
    contextExtensions: TerminatedContextExtensions,
    resultExtensions: TerminatedResultExtensions,
  ): void {
    const time = truncateDecimalDigits(resultExtensions.time);

    const data: DataPayload = {
      context: {
        extensions: {
          [ContextExtensionsDefintion.sessionId]: this.sessionId,
        },
      },
      result: {
        extensions: {
          [ResultExtensionsDefinition.time]: time,
          [ResultExtensionsDefinition.progress]: truncateDecimalDigits(
            resultExtensions.time / this.duration,
          ),
          [ResultExtensionsDefinition.playedSegment]: this.getPlayedSegment(),
        },
      },
      verb: {
        display: {
          'en-US': 'terminated',
        },
        id: VerbDefinition.terminated,
      },
    };

    if (contextExtensions.completionTreshold) {
      data.context!.extensions[ContextExtensionsDefintion.completionTreshold] =
        contextExtensions.completionTreshold;
    }

    this.send(data);
  }

  interacted(contextExtensions: InteractedContextExtensions): void {
    // find a way to remove this undefined type. There is no undefined value
    const extensions: {
      [key: string]: string | boolean | number | undefined;
    } = {
      [ContextExtensionsDefintion.sessionId]: this.sessionId,
    };
    for (const key of Object.keys(contextExtensions)) {
      extensions[
        ContextExtensionsDefintion[key as keyof InteractedContextExtensions]
      ] = contextExtensions[key as keyof InteractedContextExtensions];
    }

    const data: DataPayload = {
      context: {
        extensions,
      },
      verb: {
        display: {
          'en-US': 'interacted',
        },
        id: VerbDefinition.interacted,
      },
    };

    this.send(data);
  }

  private send(data: DataPayload) {
    fetch(`${XAPI_ENDPOINT}/`, {
      body: JSON.stringify({
        ...data,
        id: uuid(),
        timestamp: DateTime.utc().toISO(),
      }),
      headers: {
        Authorization: `Bearer ${this.jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  }

  private addStartSegment(time: number) {
    this.startSegment = time;
  }

  private addEndSegment(time: number) {
    if (this.startSegment === null) {
      return;
    }

    const playedSegments =
      this.playedSegments.length === 0 ? [] : this.playedSegments.split('[,]');
    playedSegments.push(`${this.startSegment}[.]${time}`);
    this.playedSegments = playedSegments.join('[,]');
    this.startSegment = null;
  }
}

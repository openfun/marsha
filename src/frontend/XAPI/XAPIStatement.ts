// https://liveaspankaj.gitbooks.io/xapi-video-profile/content/statement_data_model.html
import { DateTime, Interval } from 'luxon';
import uuid from 'uuid';

import { XAPI_ENDPOINT } from '../settings';
import {
  CompletedDataPlayload,
  ContextExtensionsDefinition,
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
  private isCompleted: boolean = false;

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

  getProgress(): number {
    const segments = this.getPlayedSegment().split('[,]');

    const progressLength = segments
      // remove non complete segments
      .filter(segment => segment.indexOf('[.]') >= 0)
      // split segments to have begin and end segment in an array
      .map(segment => segment.split('[.]'))
      // cast segment from string to number
      .reduce((acc: number[][], curr: string[]): number[][] => {
        acc.push([Number(curr[0]), Number(curr[1])]);

        return acc;
      }, [])
      // sort segments (numerically)
      .sort(
        (a: number[], b: number[]): number => {
          return a[0] - b[0];
        },
      )
      // once sorted, merge overlapped segments
      .reduce((acc: number[][], curr: number[], i: number): number[][] => {
        acc.push(curr);
        if (i === 0) {
          return acc;
        }

        if (acc[i][0] < acc[i - 1][1]) {
          // overlapping segments: this segment's starting point is less than last segment's end point.
          acc[i][0] = acc[i - 1][1];

          if (acc[i][0] > acc[i][1]) {
            acc[i][1] = acc[i][0];
          }
        }

        return acc;
      }, [])
      // compute progression
      .reduce((acc: number, curr: number[]): number => {
        if (curr[1] > curr[0]) {
          acc += curr[1] - curr[0];
        }

        return acc;
      }, 0);

    return progressLength / this.duration;
  }

  initialized(contextExtensions: InitializedContextExtensions): void {
    const extensions: {
      [key: string]: string | boolean | number | undefined;
    } = {
      [ContextExtensionsDefinition.sessionId]: this.sessionId,
    };
    for (const key of Object.keys(contextExtensions)) {
      extensions[
        ContextExtensionsDefinition[key as keyof InitializedContextExtensions]
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
          [ContextExtensionsDefinition.sessionId]: this.sessionId,
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
    const progress = this.getProgress();
    const data: DataPayload = {
      context: {
        extensions: {
          [ContextExtensionsDefinition.length]: this.duration,
          [ContextExtensionsDefinition.sessionId]: this.sessionId,
        },
      },
      result: {
        extensions: {
          [ResultExtensionsDefinition.time]: time,
          [ResultExtensionsDefinition.playedSegment]: this.getPlayedSegment(),
          [ResultExtensionsDefinition.progress]: truncateDecimalDigits(
            progress,
          ),
        },
      },
      verb: {
        display: {
          'en-US': 'paused',
        },
        id: VerbDefinition.paused,
      },
    };

    if (contextExtensions.completionTreshold) {
      data.context!.extensions[ContextExtensionsDefinition.completionTreshold] =
        contextExtensions.completionTreshold;
    }

    this.send(data);

    if (Math.abs(1.0 - progress) < Number.EPSILON) {
      this.completed();
    }
  }

  seeked(resultExtensions: SeekedResultExtensions): void {
    const timeFrom: number = truncateDecimalDigits(resultExtensions.timeFrom);
    const timeTo: number = truncateDecimalDigits(resultExtensions.timeTo);
    this.addEndSegment(timeFrom);
    this.addStartSegment(timeTo);

    const data: DataPayload = {
      context: {
        extensions: {
          [ContextExtensionsDefinition.sessionId]: this.sessionId,
        },
      },
      result: {
        extensions: {
          [ResultExtensionsDefinition.timeFrom]: timeFrom,
          [ResultExtensionsDefinition.timeTo]: timeTo,
          [ContextExtensionsDefinition.length]: truncateDecimalDigits(
            this.duration,
          ),
          [ResultExtensionsDefinition.progress]: truncateDecimalDigits(
            this.getProgress(),
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

  completed(): void {
    if (this.isCompleted === true) {
      return;
    }

    const time = truncateDecimalDigits(this.duration);

    const data: CompletedDataPlayload = {
      context: {
        extensions: {
          [ContextExtensionsDefinition.length]: this.duration,
          [ContextExtensionsDefinition.sessionId]: this.sessionId,
          [ContextExtensionsDefinition.completionTreshold]: 1,
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

    this.send(data);
    this.isCompleted = true;
  }

  terminated(
    contextExtensions: TerminatedContextExtensions,
    resultExtensions: TerminatedResultExtensions,
  ): void {
    const time = truncateDecimalDigits(resultExtensions.time);

    const data: DataPayload = {
      context: {
        extensions: {
          [ContextExtensionsDefinition.length]: this.duration,
          [ContextExtensionsDefinition.sessionId]: this.sessionId,
        },
      },
      result: {
        extensions: {
          [ResultExtensionsDefinition.time]: time,
          [ResultExtensionsDefinition.progress]: truncateDecimalDigits(
            this.getProgress(),
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
      data.context!.extensions[ContextExtensionsDefinition.completionTreshold] =
        contextExtensions.completionTreshold;
    }

    this.send(data);
  }

  interacted(contextExtensions: InteractedContextExtensions): void {
    // find a way to remove this undefined type. There is no undefined value
    const extensions: {
      [key: string]: string | boolean | number | undefined;
    } = {
      [ContextExtensionsDefinition.sessionId]: this.sessionId,
    };
    for (const key of Object.keys(contextExtensions)) {
      extensions[
        ContextExtensionsDefinition[key as keyof InteractedContextExtensions]
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

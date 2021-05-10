// https://liveaspankaj.gitbooks.io/xapi-video-profile/content/statement_data_model.html
import { DateTime, Interval } from 'luxon';
import { v4 as uuidv4 } from 'uuid';

import { XAPI_ENDPOINT } from '../settings';
import {
  CompletedDataPlayload,
  ContextExtensionsDefinition,
  DataPayload,
  InitializedContextExtensions,
  InteractedContextExtensions,
  InteractedResultExtensions,
  PausedResultExtensions,
  PlayedResultExtensions,
  ResultExtensionsDefinition,
  SeekedResultExtensions,
  TerminatedResultExtensions,
  VerbDefinition,
} from '../types/XAPI';
import { truncateDecimalDigits } from '../utils/truncateDecimalDigits';
import { Nullable } from '../utils/types';

export class XAPIStatement {
  private playedSegments: string = '';
  private startSegment: Nullable<number> = null;
  private duration: number = 0;
  private startedAt: Nullable<DateTime> = null;
  private isCompleted: boolean = false;
  private completionThreshold: Nullable<number> = null;

  constructor(private jwt: string, private sessionId: string) {}

  setDuration(duration: number) {
    if (this.duration > 0) {
      throw new Error('duration is already set. You can not modify it anymore');
    }

    if (duration <= 0) {
      throw new Error('duration must be strictly positive');
    }

    this.duration = duration;
    this.computeCompletionThreshold();
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
      .filter((segment) => segment.indexOf('[.]') >= 0)
      // split segments to have begin and end segment in an array
      .map((segment) => segment.split('[.]'))
      // cast segment from string to number
      .reduce((acc: number[][], curr: string[]): number[][] => {
        acc.push([Number(curr[0]), Number(curr[1])]);

        return acc;
      }, [])
      // sort segments (numerically)
      .sort((a: number[], b: number[]): number => {
        return a[0] - b[0];
      })
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

    const progress = progressLength / this.duration;

    // Force to return no more than 1 to be sure to not have a progression higher than 100%.
    // This case can be found when the last timecode os higher than the video duration.
    return progress > 1.0 ? 1.0 : progress;
  }

  /**
   * compute the completion threshold to reach to consider a video
   * as completed.
   */
  computeCompletionThreshold() {
    // beyond durationThreshold we've reached the maximal completion threshold
    const durationThreshold = 600;
    let duration = this.duration;
    if (duration > durationThreshold) {
      duration = durationThreshold;
    }
    this.completionThreshold = 0.7 + (0.25 * duration) / durationThreshold;
  }

  getCompletionThreshold(): number {
    if (this.completionThreshold === null) {
      throw new Error(
        'Completion threshold cannot be computed. You should call initialized first',
      );
    }

    return this.completionThreshold;
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

    extensions[ContextExtensionsDefinition.completionTreshold] =
      truncateDecimalDigits(this.getCompletionThreshold());
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

  paused(resultExtensions: PausedResultExtensions): void {
    const time: number = truncateDecimalDigits(resultExtensions.time);
    this.addEndSegment(time);
    const progress = this.getProgress();
    const data: DataPayload = {
      context: {
        extensions: {
          [ContextExtensionsDefinition.completionTreshold]:
            truncateDecimalDigits(this.getCompletionThreshold()),
          [ContextExtensionsDefinition.length]: this.duration,
          [ContextExtensionsDefinition.sessionId]: this.sessionId,
        },
      },
      result: {
        extensions: {
          [ResultExtensionsDefinition.time]: time,
          [ResultExtensionsDefinition.playedSegment]: this.getPlayedSegment(),
          [ResultExtensionsDefinition.progress]:
            truncateDecimalDigits(progress),
        },
      },
      verb: {
        display: {
          'en-US': 'paused',
        },
        id: VerbDefinition.paused,
      },
    };

    this.send(data);
    if (progress > this.getCompletionThreshold()) {
      this.completed(resultExtensions.time);
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

  completed(time: number): void {
    if (this.isCompleted === true) {
      return;
    }

    const data: CompletedDataPlayload = {
      context: {
        extensions: {
          [ContextExtensionsDefinition.length]: this.duration,
          [ContextExtensionsDefinition.sessionId]: this.sessionId,
          [ContextExtensionsDefinition.completionTreshold]:
            truncateDecimalDigits(this.getCompletionThreshold()),
        },
      },
      result: {
        completion: true,
        duration: Interval.fromDateTimes(this.startedAt!, DateTime.utc())
          .toDuration('milliseconds')
          .toISO(),
        extensions: {
          [ResultExtensionsDefinition.time]: truncateDecimalDigits(time),
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

  terminated(resultExtensions: TerminatedResultExtensions): void {
    if (this.startSegment !== null) {
      this.paused({ time: resultExtensions.time });
    }

    const time = truncateDecimalDigits(resultExtensions.time);

    const data: DataPayload = {
      context: {
        extensions: {
          [ContextExtensionsDefinition.completionTreshold]:
            truncateDecimalDigits(this.getCompletionThreshold()),
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

    this.send(data);
  }

  interacted(
    resultExtensions: InteractedResultExtensions,
    contextExtensions: InteractedContextExtensions,
  ): void {
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
      result: {
        extensions: {
          [ResultExtensionsDefinition.time]: truncateDecimalDigits(
            resultExtensions.time,
          ),
        },
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
    // duration is set when initialized is called.
    // While initialized is not called, no statement should be sent to the xapi server.
    if (!this.duration) {
      return;
    }

    fetch(`${XAPI_ENDPOINT}/`, {
      body: JSON.stringify({
        ...data,
        id: uuidv4(),
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

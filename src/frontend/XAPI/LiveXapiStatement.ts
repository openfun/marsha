import {
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
  XapiResourceType,
} from '../types/XAPI';
import { truncateDecimalDigits } from '../utils/truncateDecimalDigits';
import { Nullable } from '../utils/types';
import { sendXAPIStatement, VideoXAPIStatementInterface } from '.';

export class LiveXAPIStatement implements VideoXAPIStatementInterface {
  private playedSegments: string = '';
  private startSegment: Nullable<number> = null;

  constructor(private jwt: string, private sessionId: string) {}

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
      [ContextExtensionsDefinition.sessionId]: this.sessionId,
    };
    for (const key of Object.keys(contextExtensions)) {
      // ignore length
      if (key === 'length') continue;
      extensions[
        ContextExtensionsDefinition[key as keyof InitializedContextExtensions]
      ] = contextExtensions[key as keyof InitializedContextExtensions];
    }

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
    const data: DataPayload = {
      context: {
        extensions: {
          [ContextExtensionsDefinition.sessionId]: this.sessionId,
        },
      },
      result: {
        extensions: {
          [ResultExtensionsDefinition.time]: time,
          [ResultExtensionsDefinition.playedSegment]: this.getPlayedSegment(),
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
  }

  seeked(_resultExtensions: SeekedResultExtensions): void {}

  completed(_time: number): void {}

  downloaded(_quality: string | number): void {}

  terminated(resultExtensions: TerminatedResultExtensions): void {
    if (this.startSegment !== null) {
      this.paused({ time: resultExtensions.time });
    }

    const time = truncateDecimalDigits(resultExtensions.time);

    const data: DataPayload = {
      context: {
        extensions: {
          [ContextExtensionsDefinition.sessionId]: this.sessionId,
        },
      },
      result: {
        extensions: {
          [ResultExtensionsDefinition.time]: time,
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
    sendXAPIStatement(data, this.jwt, XapiResourceType.VIDEO);
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

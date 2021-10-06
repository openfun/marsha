// https://liveaspankaj.gitbooks.io/xapi-video-profile/content/statement_data_model.html
import { Video } from '../types/tracks';
import { v4 as uuidv4 } from 'uuid';
import { XAPI_ENDPOINT } from '../settings';
import {
  DataPayload,
  InitializedContextExtensions,
  InteractedContextExtensions,
  InteractedResultExtensions,
  PausedResultExtensions,
  PlayedResultExtensions,
  SeekedResultExtensions,
  TerminatedResultExtensions,
  XapiResourceType,
} from '../types/XAPI';
import { VideoXAPIStatement } from './VideoXAPIStatement';
import { LiveXAPIStatement } from './LiveXapiStatement';

export interface VideoXAPIStatementInterface {
  initialized(contextExtensions: InitializedContextExtensions): void;
  played(resultExtensions: PlayedResultExtensions): void;
  paused(resultExtensions: PausedResultExtensions): void;
  seeked(resultExtensions: SeekedResultExtensions): void;
  completed(time: number): void;
  terminated(resultExtensions: TerminatedResultExtensions): void;
  interacted(
    resultExtensions: InteractedResultExtensions,
    contextExtensions: InteractedContextExtensions,
  ): void;
  downloaded(quality: string | number): void;
}

export interface DocumentXapiStatementInterface {
  downloaded(): void;
}

export const sendXAPIStatement = (
  data: DataPayload,
  jwt: string,
  resourceType: XapiResourceType,
) => {
  fetch(`${XAPI_ENDPOINT}/${resourceType}/`, {
    body: JSON.stringify({
      ...data,
      id: uuidv4(),
    }),
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
};

export const XAPIStatement = (
  jwt: string,
  sessionId: string,
  video: Video,
): VideoXAPIStatementInterface => {
  if (video.live_state) {
    return new LiveXAPIStatement(jwt, sessionId);
  }

  return new VideoXAPIStatement(jwt, sessionId);
};

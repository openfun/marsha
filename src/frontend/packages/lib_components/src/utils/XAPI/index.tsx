import { VideoXAPIStatementInterface } from '@lib-components/types/XAPI';
import { Video } from '@lib-components/types/tracks';

import { LiveXAPIStatement } from './LiveXapiStatement';
import { VideoXAPIStatement } from './VideoXAPIStatement';

export const XAPIStatement = (
  jwt: string,
  sessionId: string,
  video: Video,
): VideoXAPIStatementInterface => {
  if (video.live_state) {
    return new LiveXAPIStatement(jwt, sessionId, video.id);
  }

  return new VideoXAPIStatement(jwt, sessionId, video.id);
};

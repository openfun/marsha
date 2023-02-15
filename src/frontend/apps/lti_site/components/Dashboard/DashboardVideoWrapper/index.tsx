import React, { useMemo } from 'react';

import {
  useVideo,
  uploadState,
  Video,
  checkLtiToken,
  decodeJwt,
  useJwt,
} from 'lib-components';
import {
  convertVideoToLive,
  generateVideoWebsocketUrl,
  getOrInitAnonymousId,
  LiveTeacherDashboard,
  VODTeacherDashboard,
} from 'lib-video';
import { useIntl } from 'react-intl';
import { errorMessages } from 'utils/messages';

interface DashboardVideoWrapperProps {
  video: Video;
}

export const DashboardVideoWrapper = ({
  video,
}: DashboardVideoWrapperProps) => {
  const intl = useIntl();
  const currentVideo = useVideo((state) => state.getVideo(video));
  const videoWebsocketUrl = useMemo(() => {
    return generateVideoWebsocketUrl(currentVideo.id, (url) => {
      const { jwt } = useJwt.getState();

      if (!checkLtiToken(decodeJwt(jwt))) {
        const anonymousId = getOrInitAnonymousId();
        url = `${url}&anonymous_id=${anonymousId}`;
      }
      return url;
    });
  }, [currentVideo.id]);

  if (video.upload_state === uploadState.DELETED) {
    if (video?.live_type === 'jitsi') {
      throw new Error(intl.formatMessage(errorMessages.liveEnded));
    } else {
      throw new Error(intl.formatMessage(errorMessages.videoDeleted));
    }
  }

  const live = convertVideoToLive(currentVideo);
  if (live && live.upload_state === uploadState.PENDING) {
    return <LiveTeacherDashboard live={live} socketUrl={videoWebsocketUrl} />;
  }

  return (
    <VODTeacherDashboard video={currentVideo} socketUrl={videoWebsocketUrl} />
  );
};

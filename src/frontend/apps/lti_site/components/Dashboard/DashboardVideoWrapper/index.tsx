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

interface DashboardVideoWrapperProps {
  video: Video;
}

export const DashboardVideoWrapper = ({
  video,
}: DashboardVideoWrapperProps) => {
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

  const live = convertVideoToLive(currentVideo);
  if (live && live.upload_state === uploadState.PENDING) {
    return <LiveTeacherDashboard live={live} socketUrl={videoWebsocketUrl} />;
  }

  return (
    <VODTeacherDashboard video={currentVideo} socketUrl={videoWebsocketUrl} />
  );
};

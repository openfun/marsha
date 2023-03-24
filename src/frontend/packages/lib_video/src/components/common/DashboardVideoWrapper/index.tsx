import { useVideo, uploadState, Video } from 'lib-components';
import React, { useMemo } from 'react';

import { LiveTeacherDashboard } from '@lib-video/components/live';
import { VODTeacherDashboard } from '@lib-video/components/vod';
import { convertVideoToLive } from '@lib-video/utils/convertVideo';
import { getOrInitAnonymousId } from '@lib-video/utils/getOrInitAnonymousId';
import { generateVideoWebsocketUrl } from '@lib-video/utils/websocket';

interface DashboardVideoWrapperProps {
  video: Video;
}

export const DashboardVideoWrapper = ({
  video,
}: DashboardVideoWrapperProps) => {
  const currentVideo = useVideo((state) => state.getVideo(video));

  const videoWebsocketUrl = useMemo(() => {
    return generateVideoWebsocketUrl(currentVideo.id, (url) => {
      const anonymousId = getOrInitAnonymousId();
      if (anonymousId) {
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

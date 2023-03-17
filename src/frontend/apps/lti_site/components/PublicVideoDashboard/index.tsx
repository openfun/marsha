import {
  checkToken,
  decodeJwt,
  FULL_SCREEN_ERROR_ROUTE,
  uploadState,
  useJwt,
  useVideo,
  Video,
} from 'lib-components';
import {
  convertVideoToLive,
  generateVideoWebsocketUrl,
  getOrInitAnonymousId,
  LiveStudentDashboard,
  VODStudentDashboard,
} from 'lib-video';
import React, { useMemo } from 'react';
import { Redirect } from 'react-router-dom';

interface PublicVideoDashboardProps {
  video: Video;
  playerType: string;
}

const PublicVideoDashboard = ({
  video,
  playerType,
}: PublicVideoDashboardProps) => {
  const currentVideo = useVideo((state) => state.getVideo(video));
  const videoWebsocketUrl = useMemo(() => {
    return generateVideoWebsocketUrl(currentVideo.id, (url) => {
      const { jwt } = useJwt.getState();

      if (!checkToken(decodeJwt(jwt))) {
        const anonymousId = getOrInitAnonymousId();
        url = `${url}&anonymous_id=${anonymousId}`;
      }
      return url;
    });
  }, [currentVideo.id]);

  const live = convertVideoToLive(currentVideo);
  if (live) {
    return (
      <LiveStudentDashboard
        playerType={playerType}
        live={live}
        socketUrl={videoWebsocketUrl}
      />
    );
  }

  if (video.upload_state === uploadState.DELETED) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('videoDeleted')} />;
  }

  return (
    <VODStudentDashboard
      playerType={playerType}
      video={currentVideo}
      socketUrl={videoWebsocketUrl}
    />
  );
};

export default PublicVideoDashboard;

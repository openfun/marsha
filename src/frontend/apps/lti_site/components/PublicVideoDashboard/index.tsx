import {
  ErrorComponents,
  Video,
  builderFullScreenErrorRoute,
  checkToken,
  decodeJwt,
  uploadState,
  useJwt,
  useVideo,
} from 'lib-components';
import {
  LiveStudentDashboard,
  VODStudentDashboard,
  convertVideoToLive,
  generateVideoWebsocketUrl,
  getOrInitAnonymousId,
} from 'lib-video';
import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';

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
    return (
      <Navigate
        to={builderFullScreenErrorRoute(ErrorComponents.videoDeleted)}
      />
    );
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

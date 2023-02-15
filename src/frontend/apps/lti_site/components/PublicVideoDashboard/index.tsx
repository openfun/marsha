import {
  checkLtiToken,
  decodeJwt,
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
import { useIntl } from 'react-intl';
import { errorMessages } from 'utils/messages';

interface PublicVideoDashboardProps {
  video: Video;
  playerType: string;
}

const PublicVideoDashboard = ({
  video,
  playerType,
}: PublicVideoDashboardProps) => {
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
    throw new Error(intl.formatMessage(errorMessages.videoDeleted));
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

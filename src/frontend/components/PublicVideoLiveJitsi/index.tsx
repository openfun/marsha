import React from 'react';
import { Redirect } from 'react-router-dom';

import { PLAYER_ROUTE } from 'components/routes';
import { LiveType, LiveVideoWrapper } from 'components/StudentLiveWrapper';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { useVideo } from 'data/stores/useVideo';
import { modelName } from 'types/models';
import { Video } from 'types/tracks';

interface PublicVideoLiveJitsiProps {
  video: Video;
}

const PublicVideoLiveJitsi = ({
  video: baseVideo,
}: PublicVideoLiveJitsiProps) => {
  const video = useVideo((state) => state.getVideo(baseVideo));
  const kicked = useParticipantWorkflow((state) => state.kicked);

  if (kicked) {
    return <Redirect to={PLAYER_ROUTE(modelName.VIDEOS)} />;
  }

  return (
    <LiveVideoWrapper
      video={video}
      configuration={{ type: LiveType.ON_STAGE }}
    />
  );
};

export default PublicVideoLiveJitsi;

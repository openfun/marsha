import { Box } from 'grommet';
import React from 'react';
import { Navigate } from 'react-router-dom';

import { useParticipantWorkflow } from '../../data/stores/useParticipantWorkflow';
import { useVideo } from '../../data/stores/useVideo';
import { Video } from '../../types/tracks';
import { JoinDiscussionLeaveButton } from '../JoinDiscussionLeaveButton';
import DashboardVideoLiveJitsi from '../DashboardVideoLiveJitsi';
import { PLAYER_ROUTE } from '../routes';
import { modelName } from '../../types/models';

interface PublicVideoLiveJitsiProps {
  video: Video;
}

const PublicVideoLiveJitsi = ({
  video: baseVideo,
}: PublicVideoLiveJitsiProps) => {
  const video = useVideo((state) => state.getVideo(baseVideo));
  const kicked = useParticipantWorkflow((state) => state.kicked);

  if (kicked) {
    return <Navigate to={PLAYER_ROUTE(modelName.VIDEOS)} />;
  }

  return (
    <React.Fragment>
      <DashboardVideoLiveJitsi video={video} />
      <Box
        direction="row"
        margin="small"
        alignContent="center"
        justify="center"
      >
        <JoinDiscussionLeaveButton />
      </Box>
    </React.Fragment>
  );
};

export default PublicVideoLiveJitsi;

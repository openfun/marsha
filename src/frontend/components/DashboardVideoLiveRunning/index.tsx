import { Box } from 'grommet';
import React from 'react';

import { DashboardJoinDiscussion } from 'components/DashboardJoinDiscussion';
import { LiveModeType, Video } from 'types/tracks';

interface DashboardVideoLiveRunningProps {
  video: Video;
}

export const DashboardVideoLiveRunning = ({
  video,
}: DashboardVideoLiveRunningProps) => {
  return (
    <Box fill>
      {video.live_type === LiveModeType.JITSI && (
        <DashboardJoinDiscussion video={video} />
      )}
    </Box>
  );
};

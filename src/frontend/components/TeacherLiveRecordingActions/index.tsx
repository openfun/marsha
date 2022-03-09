import { Box } from 'grommet';
import React, { Fragment } from 'react';

import { liveState, Video } from 'types/tracks';

import { StartRecording } from './StartRecording';
import { StopRecording } from './StopRecording';

interface TeacherLiveRecordingActionsProps {
  video: Video;
}

export const TeacherLiveRecordingActions = ({
  video,
}: TeacherLiveRecordingActionsProps) => {
  if (video.live_state !== liveState.RUNNING) {
    return <Fragment />;
  }

  if (video.is_recording) {
    return (
      <Box flex pad={{ horizontal: 'auto', vertical: 'small' }}>
        <StopRecording video={video} />
      </Box>
    );
  } else {
    return (
      <Box flex pad={{ horizontal: 'auto', vertical: 'small' }}>
        <StartRecording video={video} />
      </Box>
    );
  }
};

import { Box } from 'grommet';
import React, { Fragment } from 'react';

import { liveState, Video } from 'types/tracks';

import { StartRecording } from './StartRecording';
import { StopRecording } from './StopRecording';

interface TeacherLiveRecordingActionsProps {
  isJitsiAdministrator: boolean;
  video: Video;
}

export const TeacherLiveRecordingActions = ({
  isJitsiAdministrator,
  video,
}: TeacherLiveRecordingActionsProps) => {
  if (
    video.live_state !== liveState.RUNNING ||
    !isJitsiAdministrator ||
    !video.allow_recording
  ) {
    return <Fragment />;
  }

  if (video.is_recording) {
    return (
      <Box
        flex
        margin={{ horizontal: 'medium' }}
        pad={{ horizontal: 'auto', vertical: 'small' }}
      >
        <StopRecording video={video} />
      </Box>
    );
  } else {
    return (
      <Box
        flex
        margin={{ horizontal: 'medium' }}
        pad={{ horizontal: 'auto', vertical: 'small' }}
      >
        <StartRecording video={video} />
      </Box>
    );
  }
};

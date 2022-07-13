import { Box } from 'grommet';
import React, { Fragment } from 'react';

import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { liveState } from 'types/tracks';

import { StartRecording } from './StartRecording';
import { StopRecording } from './StopRecording';

interface TeacherLiveRecordingActionsProps {
  isJitsiAdministrator: boolean;
}

export const TeacherLiveRecordingActions = ({
  isJitsiAdministrator,
}: TeacherLiveRecordingActionsProps) => {
  const video = useCurrentVideo();

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
        <StopRecording />
      </Box>
    );
  } else {
    return (
      <Box
        flex
        margin={{ horizontal: 'medium' }}
        pad={{ horizontal: 'auto', vertical: 'small' }}
      >
        <StartRecording />
      </Box>
    );
  }
};

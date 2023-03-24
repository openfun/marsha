import { Box } from 'grommet';
import { liveState } from 'lib-components';
import React, { Fragment } from 'react';

import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

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
        flex={{ grow: 0 }}
        margin={{ horizontal: 'medium' }}
        pad={{ horizontal: 'auto', vertical: 'small' }}
      >
        <StopRecording />
      </Box>
    );
  } else {
    return (
      <Box
        flex={{ grow: 0 }}
        margin={{ horizontal: 'medium' }}
        pad={{ horizontal: 'auto', vertical: 'small' }}
      >
        <StartRecording />
      </Box>
    );
  }
};

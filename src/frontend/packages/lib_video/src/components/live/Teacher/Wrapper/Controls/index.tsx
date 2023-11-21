import { Box } from 'lib-components';
import React, { Fragment } from 'react';

import { TeacherLiveControlBar } from './TeacherLiveControlBar';
import { TeacherLiveLifecycleControls } from './TeacherLiveLifecycleControls';
import { TeacherLiveRecordingActions } from './TeacherLiveRecordingActions';

interface ControlsProps {
  isLiveStarted: boolean;
  canStartLive: boolean;
  canShowStartButton: boolean;
}

export const Controls = ({
  isLiveStarted,
  canStartLive,
  canShowStartButton,
}: ControlsProps) => {
  return (
    <Fragment>
      {isLiveStarted && <TeacherLiveControlBar />}
      <Box
        direction="row"
        justify="space-evenly"
        gap="xsmall"
        style={{ flexFlow: 'wrap' }}
      >
        <TeacherLiveRecordingActions isJitsiAdministrator={canStartLive} />
        <TeacherLiveLifecycleControls
          canStartStreaming={canShowStartButton}
          hasRightToStart={canStartLive}
        />
      </Box>
    </Fragment>
  );
};

import { Box } from 'grommet';
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
        flex={isLiveStarted}
        direction="row"
        style={{ flex: '0' }}
        justify="evenly"
        width={{
          min: 'auto',
        }}
      >
        <TeacherLiveRecordingActions isJitsiAdministrator={canStartLive} />
        <TeacherLiveLifecycleControls
          canStartStreaming={canShowStartButton}
          flex={isLiveStarted ? { shrink: 1 } : false}
          hasRightToStart={canStartLive}
        />
      </Box>
    </Fragment>
  );
};

import { Stack } from 'grommet';
import React, { Dispatch, lazy, SetStateAction } from 'react';

import { TeacherLiveStopConfirmation } from 'components/TeacherLiveStopConfirmation';
import { useStopLiveConfirmation } from 'data/stores/useStopLiveConfirmation';
import { LiveModeType, Video } from 'types/tracks';

const TeacherLiveRawWrapper = lazy(
  () => import('components/TeacherLiveRawWrapper'),
);
const DashboardVideoLiveJitsi = lazy(
  () => import('components/DashboardVideoLiveJitsi'),
);

interface TeacherLiveContentProps {
  video: Video;
  setCanShowStartButton: Dispatch<SetStateAction<boolean>>;
  setCanStartLive: Dispatch<SetStateAction<boolean>>;
}

export const TeacherLiveContent = ({
  setCanShowStartButton,
  setCanStartLive,
  video,
}: TeacherLiveContentProps) => {
  const shouldShowStopConfirmation = useStopLiveConfirmation()[0];

  return (
    <Stack fill interactiveChild="last">
      {video.live_type === LiveModeType.RAW && (
        <TeacherLiveRawWrapper video={video} />
      )}
      {video.live_type === LiveModeType.JITSI && (
        <DashboardVideoLiveJitsi
          isInstructor={true}
          setCanShowStartButton={setCanShowStartButton}
          setCanStartLive={setCanStartLive}
          video={video}
        />
      )}
      {shouldShowStopConfirmation && (
        <TeacherLiveStopConfirmation video={video} />
      )}
    </Stack>
  );
};

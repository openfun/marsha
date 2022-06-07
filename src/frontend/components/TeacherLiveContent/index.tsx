import { Stack } from 'grommet';
import React, { Dispatch, lazy, SetStateAction } from 'react';
import { Redirect } from 'react-router-dom';

import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { LiveModale } from 'components/LiveModale';
import { useLiveModaleConfiguration } from 'data/stores/useLiveModale';
import { convertVideoToJitsiLive, LiveModeType, Video } from 'types/tracks';

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
  const [modaleConfiguration] = useLiveModaleConfiguration();

  const jitsiLive = convertVideoToJitsiLive(video);

  return (
    <Stack fill interactiveChild="last">
      {video.live_type === LiveModeType.RAW && (
        <TeacherLiveRawWrapper video={video} />
      )}
      {video.live_type === LiveModeType.JITSI && jitsiLive ? (
        <DashboardVideoLiveJitsi
          isInstructor={true}
          setCanShowStartButton={setCanShowStartButton}
          setCanStartLive={setCanStartLive}
          liveJitsi={jitsiLive}
        />
      ) : (
        <Redirect to={FULL_SCREEN_ERROR_ROUTE()} />
      )}
      {modaleConfiguration && <LiveModale {...modaleConfiguration} />}
    </Stack>
  );
};

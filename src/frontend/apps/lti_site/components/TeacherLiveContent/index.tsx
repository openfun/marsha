import React, { Dispatch, lazy, SetStateAction } from 'react';
import { Redirect } from 'react-router-dom';

import { FULL_SCREEN_ERROR_ROUTE } from 'lib-components';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { LiveModeType } from 'lib-components';
import { convertVideoToJitsiLive } from 'utils/conversions/convertVideo';
import { ShouldNotHappen } from 'lib-components';

const TeacherLiveRawWrapper = lazy(
  () => import('components/TeacherLiveRawWrapper'),
);
const DashboardLiveJitsi = lazy(() => import('components/DashboardLiveJitsi'));

interface TeacherLiveContentProps {
  setCanShowStartButton: Dispatch<SetStateAction<boolean>>;
  setCanStartLive: Dispatch<SetStateAction<boolean>>;
}

export const TeacherLiveContent = ({
  setCanShowStartButton,
  setCanStartLive,
}: TeacherLiveContentProps) => {
  const video = useCurrentVideo();
  const jitsiLive = convertVideoToJitsiLive(video);

  switch (video.live_type) {
    case null:
      return <Redirect to={FULL_SCREEN_ERROR_ROUTE()} />;
    case LiveModeType.RAW:
      return <TeacherLiveRawWrapper video={video} />;
    case LiveModeType.JITSI:
      if (jitsiLive) {
        return (
          <DashboardLiveJitsi
            isInstructor={true}
            setCanShowStartButton={setCanShowStartButton}
            setCanStartLive={setCanStartLive}
            liveJitsi={jitsiLive}
          />
        );
      } else {
        return <Redirect to={FULL_SCREEN_ERROR_ROUTE()} />;
      }
    default:
      throw new ShouldNotHappen(video.live_type);
  }
};

import React, { Dispatch, lazy, SetStateAction } from 'react';
import { Redirect } from 'react-router-dom';

import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { LiveModeType, Video } from 'types/tracks';
import { convertVideoToJitsiLive } from 'utils/conversions/convertVideo';
import { ShouldNotHappen } from 'utils/errors/exception';

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
  const jitsiLive = convertVideoToJitsiLive(video);

  switch (video.live_type) {
    case null:
      return <Redirect to={FULL_SCREEN_ERROR_ROUTE()} />;
    case LiveModeType.RAW:
      return <TeacherLiveRawWrapper video={video} />;
    case LiveModeType.JITSI:
      if (jitsiLive) {
        return (
          <DashboardVideoLiveJitsi
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

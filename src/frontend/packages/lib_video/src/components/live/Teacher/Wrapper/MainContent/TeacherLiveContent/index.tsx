import { LiveModeType, ShouldNotHappen } from 'lib-components';
import React, { Dispatch, SetStateAction, lazy } from 'react';

import { InvalidJitsiLiveException } from '@lib-video/errors';
import { useCurrentLive } from '@lib-video/hooks/useCurrentVideo';
import { convertLiveToJitsiLive } from '@lib-video/utils/convertVideo';

const TeacherLiveRawWrapper = lazy(() => import('./TeacherLiveRawWrapper'));
const DashboardLiveJitsi = lazy(
  () => import('@lib-video/components/live/common/DashboardLiveJitsi'),
);

interface TeacherLiveContentProps {
  setCanShowStartButton: Dispatch<SetStateAction<boolean>>;
  setCanStartLive: Dispatch<SetStateAction<boolean>>;
}

export const TeacherLiveContent = ({
  setCanShowStartButton,
  setCanStartLive,
}: TeacherLiveContentProps) => {
  const live = useCurrentLive();
  const jitsiLive = convertLiveToJitsiLive(live);

  switch (live.live_type) {
    case LiveModeType.RAW:
      return <TeacherLiveRawWrapper video={live} />;
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
        throw new InvalidJitsiLiveException(
          'Type of live is JITSI but this is not a jitsi live',
        );
      }
    default:
      throw new ShouldNotHappen(live.live_type);
  }
};

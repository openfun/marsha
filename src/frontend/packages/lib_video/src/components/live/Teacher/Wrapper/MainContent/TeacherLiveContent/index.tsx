import { LiveModeType, ShouldNotHappen } from 'lib-components';
import React, { Dispatch, lazy, SetStateAction } from 'react';

import { InvalidJitsiLiveException } from 'errors';
import { useCurrentLive } from 'hooks/useCurrentVideo';
import { convertLiveToJitsiLive } from 'utils/convertVideo';

const TeacherLiveRawWrapper = lazy(() => import('./TeacherLiveRawWrapper'));
const DashboardLiveJitsi = lazy(
  () => import('components/live/common/DashboardLiveJitsi'),
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

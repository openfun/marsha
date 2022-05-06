import { DateTime } from 'luxon';
import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FullScreenError } from 'components/ErrorComponents';
import { Loader } from 'components/Loader';
import { StudentLiveAdvertising } from 'components/StudentLiveAdvertising';
import { StudentLiveWrapper } from 'components/StudentLiveWrapper';
import { getDecodedJwt } from 'data/appData';
import { pollForLive } from 'data/sideEffects/pollForLive';
import { useLiveStateStarted } from 'data/stores/useLiveStateStarted';
import { initVideoWebsocket } from 'data/websocket';
import { modelName } from 'types/models';
import { liveState, Live } from 'types/tracks';
import { initWebinarContext } from 'utils/initWebinarContext';
import { useAsyncEffect } from 'utils/useAsyncEffect';

interface PublicLiveDashboardProps {
  live: Live;
  playerType: string;
}

export const PublicLiveDashboard = ({
  live,
  playerType,
}: PublicLiveDashboardProps) => {
  const intl = useIntl();
  const [isReadyLive, setIsReadyLive] = useState(false);
  const liveScheduleStartDate = useMemo(() => {
    if (!live.starting_at) {
      return undefined;
    }

    return DateTime.fromISO(live.starting_at).setLocale(intl.locale);
  }, [live, intl]);
  const { isStarted, setIsLiveStarted } = useLiveStateStarted((state) => ({
    isStarted: state.isStarted,
    setIsLiveStarted: state.setIsStarted,
  }));

  useAsyncEffect(async () => {
    if (!isReadyLive) {
      await initWebinarContext(live, intl.locale);
      initVideoWebsocket(live);
      setIsReadyLive(true);
    }
  }, [isReadyLive, live]);

  useEffect(() => {
    let canceled = false;
    const poll = async () => {
      if (isStarted || !live.urls || live.live_state !== liveState.RUNNING) {
        return;
      }

      await pollForLive(live.urls);
      if (canceled) {
        return;
      }

      setIsLiveStarted(true);
    };

    poll();
    return () => {
      canceled = true;
    };
  }, [live, isStarted]);

  //    reset live state on live stop
  useEffect(() => {
    if (isStarted && live.live_state !== liveState.RUNNING) {
      setIsLiveStarted(false);
    }
  }, [live, isStarted]);

  if (!isReadyLive) {
    //  live context is not ready yet,
    //  wait for websocket and session to be initialised
    return <Loader />;
  }

  const isScheduledPassed =
    (liveScheduleStartDate && liveScheduleStartDate < DateTime.now()) ||
    !liveScheduleStartDate;
  if (
    getDecodedJwt().permissions.can_update &&
    [liveState.STOPPING, liveState.STOPPED].includes(live.live_state)
  ) {
    // user has update permission, we redirect him to the dashboard
    return <Redirect push to={DASHBOARD_ROUTE(modelName.VIDEOS)} />;
  } else if (
    [
      liveState.STOPPING,
      liveState.STOPPED,
      liveState.HARVESTING,
      liveState.HARVESTED,
    ].includes(live.live_state) &&
    isScheduledPassed
  ) {
    return <FullScreenError code={'liveStopped'} />;
  } else if (!isStarted) {
    return <StudentLiveAdvertising video={live} />;
  }

  return <StudentLiveWrapper video={live} playerType={playerType} />;
};

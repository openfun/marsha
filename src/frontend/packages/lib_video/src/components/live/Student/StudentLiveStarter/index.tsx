/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Maybe } from 'lib-common';
import { JoinMode, liveState, useVideo } from 'lib-components';
import { DateTime } from 'luxon';
import React, { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';

import { pollForLive } from '@lib-video/api/pollForLive';
import { useCurrentLive } from '@lib-video/hooks/useCurrentVideo';
import { JitsiApiProvider } from '@lib-video/hooks/useJitsiApi';
import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { useLiveStateStarted } from '@lib-video/hooks/useLiveStateStarted';
import { useParticipantWorkflow } from '@lib-video/hooks/useParticipantWorkflow';
import { PictureInPictureProvider } from '@lib-video/hooks/usePictureInPicture';
import { converse } from '@lib-video/utils/window';

import { StudentLiveAdvertising } from './StudentLiveAdvertising';
import { StudentLiveWaitingRoom } from './StudentLiveWaitingRoom';
import { StudentLiveWrapper } from './StudentLiveWrapper';

interface StudentLiveStarterProps {
  playerType: string;
}

export const StudentLiveStarter = ({ playerType }: StudentLiveStarterProps) => {
  const intl = useIntl();
  const live = useCurrentLive();
  const session = useLiveSession();
  const id3Video = useVideo((state) => state.id3Video);
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
  const { isParticipantOnstage, hasParticipantAsked, setAsked } =
    useParticipantWorkflow((state) => ({
      isParticipantOnstage: state.accepted,
      hasParticipantAsked: state.asked,
      setAsked: state.setAsked,
    }));

  useEffect(() => {
    let canceled = false;
    const poll = async () => {
      if (
        isStarted ||
        !live.urls ||
        live.live_state !== liveState.RUNNING ||
        live.join_mode === JoinMode.FORCED
      ) {
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
  }, [live, isStarted, setIsLiveStarted]);

  useEffect(() => {
    let canceled = false;
    let askParticipantToJoinTimeout: Maybe<number>;
    let waitAskParticipantToJoinTimeout: Maybe<number>;

    // Try to ask participant to join
    // Retry as the room may not be ready yet
    const askParticipantToJoin = async () => {
      try {
        await converse.askParticipantToJoin();

        if (canceled) {
          return;
        }
        setAsked();
      } catch (_) {
        askParticipantToJoinTimeout = window.setTimeout(() => {
          askParticipantToJoin();
        }, 1000);
      }
      return () => {
        canceled = true;
      };
    };

    // Wait for askParticipantToJoin to be loaded in converse
    // Retry as all converse plugins may not be loaded yet
    const waitAskParticipantToJoinLoaded = () => {
      if (!converse.askParticipantToJoin) {
        waitAskParticipantToJoinTimeout = window.setTimeout(
          waitAskParticipantToJoinLoaded,
          1000,
        );
      } else {
        askParticipantToJoin();
      }
    };

    if (
      live.join_mode === JoinMode.FORCED &&
      !hasParticipantAsked &&
      !isParticipantOnstage &&
      session.liveSession?.display_name
    ) {
      waitAskParticipantToJoinLoaded();
    }

    return () => {
      if (askParticipantToJoinTimeout) {
        window.clearTimeout(askParticipantToJoinTimeout);
      }
      if (waitAskParticipantToJoinTimeout) {
        window.clearTimeout(waitAskParticipantToJoinTimeout);
      }
    };
  }, [
    hasParticipantAsked,
    isParticipantOnstage,
    live,
    setAsked,
    session.liveSession?.display_name,
  ]);

  useEffect(() => {
    if (
      live.join_mode === JoinMode.FORCED &&
      ((isParticipantOnstage && !isStarted) ||
        live.live_state === liveState.RUNNING)
    ) {
      setIsLiveStarted(true);
    }
  }, [isParticipantOnstage, isStarted, live, setIsLiveStarted]);

  // reset live state on live stop
  useEffect(() => {
    if (
      isStarted &&
      !isParticipantOnstage &&
      ((live.join_mode !== JoinMode.FORCED &&
        live.live_state !== liveState.RUNNING) ||
        (live.join_mode === JoinMode.FORCED &&
          ![liveState.RUNNING, liveState.STARTING].includes(live.live_state)))
    ) {
      setIsLiveStarted(false);
    }
  }, [
    isParticipantOnstage,
    isStarted,
    live.join_mode,
    live.live_state,
    setIsLiveStarted,
  ]);

  const isScheduledPassed =
    (liveScheduleStartDate && liveScheduleStartDate < DateTime.now()) ||
    !liveScheduleStartDate;

  if (
    id3Video?.live_state !== liveState.RUNNING &&
    (([
      liveState.STOPPING,
      liveState.STOPPED,
      liveState.HARVESTING,
      liveState.HARVESTED,
    ].includes(live.live_state) &&
      isScheduledPassed) ||
      !isStarted)
  ) {
    return <StudentLiveAdvertising />;
  } else if (
    !session.liveSession?.display_name &&
    live.join_mode === JoinMode.FORCED
  ) {
    return <StudentLiveWaitingRoom />;
  }

  return (
    <PictureInPictureProvider value={{ reversed: true }}>
      <JitsiApiProvider value={undefined}>
        <StudentLiveWrapper playerType={playerType} />
      </JitsiApiProvider>
    </PictureInPictureProvider>
  );
};

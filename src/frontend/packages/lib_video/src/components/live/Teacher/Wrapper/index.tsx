import { Box } from 'grommet';
import {
  JoinMode,
  LiveModeType,
  liveState,
  useAppConfig,
} from 'lib-components';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { TeacherVideoInfoBar } from '@lib-video/components/common/TeacherVideoInfoBar';
import { VideoLayout } from '@lib-video/components/common/VideoLayout';
import { toolbarButtons } from '@lib-video/components/live/common/DashboardLiveJitsi/utils';
import { LiveVideoPanel } from '@lib-video/components/live/common/LiveVideoPanel';
import { useCurrentLive } from '@lib-video/hooks/useCurrentVideo';
import { useJitsiApi } from '@lib-video/hooks/useJitsiApi';
import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';
import { usePictureInPicture } from '@lib-video/hooks/usePictureInPicture';
import { converse } from '@lib-video/utils/window';

import { DashboardControlPane } from '../../../common/DashboardControlPane';

import { Controls } from './Controls';
import { MainContent } from './MainContent';
import {
  ON_STAGE_REQUEST_TOAST_ID,
  OnStageRequestToast,
} from './OnStageRequestToast';
import { TeacherLiveTypeSwitch } from './TeacherLiveTypeSwitch';

export const TeacherLiveWrapper = () => {
  const live = useCurrentLive();
  const appData = useAppConfig();
  const [showPanelTrigger, setShowPanelTrigger] = useState(true);

  const { isPanelVisible, configPanel, currentItem, setPanelVisibility } =
    useLivePanelState((state) => ({
      isPanelVisible: state.isPanelVisible,
      configPanel: state.setAvailableItems,
      currentItem: state.currentItem,
      setPanelVisibility: state.setPanelVisibility,
    }));
  const [canStartLive, setCanStartLive] = useState(
    live.live_type === LiveModeType.RAW,
  );
  const [canShowStartButton, setCanShowStartButton] = useState(
    live.live_type === LiveModeType.RAW,
  );
  const [pipState] = usePictureInPicture();
  const [jitsiApi] = useJitsiApi();

  useEffect(() => {
    // if the xmpp object is not null, panel state is filled
    if (live.xmpp !== null) {
      const items = [];
      if (live.has_chat) {
        items.push(LivePanelItem.CHAT);
      }
      items.push(LivePanelItem.VIEWERS_LIST);
      configPanel(
        items,
        // If the panel has a previous selected tab, it is this one which is used
        currentItem ? currentItem : LivePanelItem.CHAT,
      );
    }
    // if the xmpp object becomes unavailable, panel is uninitialized (but selected tab stays unchanged)
    else {
      configPanel([]);
    }
  }, [live, configPanel, currentItem]);

  // On mount and live started, open the livePanel by default
  useEffect(() => {
    if (live.xmpp && currentItem && showPanelTrigger) {
      setPanelVisibility(true);
      setShowPanelTrigger(false);
    }
  }, [live.xmpp, currentItem, showPanelTrigger, setPanelVisibility]);

  useEffect(() => {
    if (live.join_mode !== JoinMode.FORCED) {
      return;
    }

    live.participants_asking_to_join.forEach((participant) => {
      converse.acceptParticipantToJoin(participant, live);
    });
  }, [live, live.join_mode, live.participants_asking_to_join]);

  useEffect(() => {
    if (
      jitsiApi &&
      live.active_shared_live_media &&
      live.active_shared_live_media.urls &&
      pipState.reversed
    ) {
      jitsiApi.executeCommand('overwriteConfig', {
        toolbarButtons: [],
      });
    } else if (jitsiApi) {
      jitsiApi.executeCommand('overwriteConfig', {
        toolbarButtons,
      });
    }
  }, [pipState, jitsiApi, live]);

  //  When the live is started,
  //  XMPP is ready to be used and therefore we can show chat and viewers buttons
  const isLiveStarted = live.live_state !== liveState.IDLE;

  const lastArrayOfParticipantsAskingToJoin = useRef(
    live.participants_asking_to_join,
  );

  useEffect(() => {
    if (isPanelVisible && currentItem === LivePanelItem.VIEWERS_LIST) {
      toast.remove(ON_STAGE_REQUEST_TOAST_ID);
    }

    if (
      lastArrayOfParticipantsAskingToJoin.current ===
      live.participants_asking_to_join
    ) {
      return;
    }

    lastArrayOfParticipantsAskingToJoin.current =
      live.participants_asking_to_join;

    const shouldDisplayToast =
      isLiveStarted &&
      live.participants_asking_to_join.length !== 0 &&
      live.join_mode !== JoinMode.FORCED &&
      !(isPanelVisible && currentItem === LivePanelItem.VIEWERS_LIST);

    if (shouldDisplayToast) {
      toast.custom(
        <OnStageRequestToast
          participantsList={live.participants_asking_to_join}
        />,
        {
          id: ON_STAGE_REQUEST_TOAST_ID,
          duration: Infinity,
        },
      );
    }
  }, [
    live.participants_asking_to_join,
    isLiveStarted,
    live.join_mode,
    isPanelVisible,
    currentItem,
  ]);

  return (
    <VideoLayout
      isLive
      actionsElement={
        <Controls
          isLiveStarted={isLiveStarted}
          canStartLive={canStartLive}
          canShowStartButton={canShowStartButton}
        />
      }
      additionalContent={
        <Fragment>
          {appData.flags?.live_raw &&
            [liveState.IDLE, liveState.STOPPED].includes(live.live_state) && (
              <Box direction="row" justify="center" margin="small">
                <TeacherLiveTypeSwitch />
              </Box>
            )}
          <DashboardControlPane isLive />
        </Fragment>
      }
      displayActionsElement
      isXmppReady={!!live.xmpp}
      liveTitleElement={
        <TeacherVideoInfoBar
          flex={isLiveStarted ? { grow: 1, shrink: 2 } : true}
          startDate={live.starting_at}
        />
      }
      mainElement={
        <MainContent
          setCanShowStartButton={setCanShowStartButton}
          setCanStartLive={setCanStartLive}
        />
      }
      sideElement={<LiveVideoPanel isLive />}
    />
  );
};

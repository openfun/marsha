import { Box, Layer } from 'grommet';
import { Nullable } from 'lib-common';
import React, { useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Redirect } from 'react-router-dom';

import DashboardLiveJitsi from 'components/DashboardLiveJitsi';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { AudioControl } from 'components/JitsiControls/AudioControl';
import { CameraControl } from 'components/JitsiControls/CameraControl';
import { LiveVideoLayout } from 'components/LiveVideoLayout';
import { LiveVideoPanel } from 'components/LiveVideoPanel';
import { PictureInPictureLayer } from 'components/PictureInPictureLayer';
import { SharedMediaExplorer } from 'components/SharedMediaExplorer';
import { StudentLiveControlBar } from 'components/StudentLiveControlBar';
import { StudentLiveInfoBar } from 'components/StudentLiveInfoBar';
import { StudentLiveRecordingInfo } from 'components/StudentLiveRecordingInfo';
import VideoPlayer from 'components/VideoPlayer';
import { pushAttendance } from 'data/sideEffects/pushAttendance';
import { useAppConfig } from 'lib-components';
import { useCurrentLive } from 'data/stores/useCurrentRessource/useCurrentVideo';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { usePictureInPicture } from 'data/stores/usePictureInPicture';
import { convertLiveToJitsiLive } from 'utils/conversions/convertVideo';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';

import { UpdateCurrentSharedLiveMediaPage } from './UpdateCurrentSharedLiveMediaPage';

const messages = defineMessages({
  defaultLiveTitle: {
    defaultMessage: 'No title',
    description:
      'Default live title for students (if the live has no title set)',
    id: 'components.StudentLiveWrapper.defaultLiveTitle',
  },
});

interface StudentLiveWrapperProps {
  playerType: string;
}

export const StudentLiveWrapper: React.FC<StudentLiveWrapperProps> = ({
  playerType,
}) => {
  const intl = useIntl();
  const appData = useAppConfig();
  const live = useCurrentLive();
  const mainElementRef = useRef<Nullable<HTMLDivElement>>(null);

  const { configPanel, currentItem, setPanelVisibility } = useLivePanelState(
    (state) => ({
      configPanel: state.setAvailableItems,
      currentItem: state.currentItem,
      setPanelVisibility: state.setPanelVisibility,
    }),
  );
  const isParticipantOnstage = useParticipantWorkflow(
    (state) => state.accepted,
  );
  const [showPanelTrigger, setShowPanelTrigger] = useState(true);
  const [pipState] = usePictureInPicture();

  useEffect(() => {
    if (isParticipantOnstage) {
      const interval = window.setInterval(() => {
        const attendance = {
          [Math.round(Date.now() / 1000)]: {
            onStage: true,
          },
        };
        pushAttendance(attendance, intl.locale, getOrInitAnonymousId());
      }, appData.attendanceDelay);
      return () => {
        // Stop tracking attendances as we unmount
        window.clearInterval(interval);
      };
    }
  }, [isParticipantOnstage, intl.locale, appData]);

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
        // if the panel has a previous selected tab, it is this one which is used
        currentItem ? currentItem : LivePanelItem.CHAT,
      );
    }
    // if the xmpp object becomes unavailable, panel is uninitialized (but selected tab stays unchanged)
    else {
      configPanel([]);
    }
  }, [live.xmpp]);

  // show panel only when user first time comes on the live
  useEffect(() => {
    if (live.xmpp && currentItem && showPanelTrigger) {
      setPanelVisibility(true);
      setShowPanelTrigger(false);
    }
  }, [live.xmpp, currentItem, showPanelTrigger]);

  const jitsiLive = convertLiveToJitsiLive(live);
  if (isParticipantOnstage && !jitsiLive) {
    return <Redirect to={FULL_SCREEN_ERROR_ROUTE()} />;
  }

  return (
    <LiveVideoLayout
      actionsElement={<StudentLiveControlBar />}
      displayActionsElement={!!live.xmpp}
      isXmppReady={!!live.xmpp}
      liveTitleElement={
        <StudentLiveInfoBar
          title={live.title ?? intl.formatMessage(messages.defaultLiveTitle)}
          startDate={live.starting_at}
        />
      }
      mainElement={
        <Box ref={mainElementRef}>
          <PictureInPictureLayer
            mainElement={
              isParticipantOnstage && jitsiLive ? (
                <DashboardLiveJitsi liveJitsi={jitsiLive} />
              ) : (
                <VideoPlayer
                  playerType={playerType}
                  timedTextTracks={[]}
                  video={live}
                />
              )
            }
            secondElement={
              live.active_shared_live_media &&
              (live.active_shared_live_media.urls ? (
                <SharedMediaExplorer
                  initialPage={live.active_shared_live_media_page!}
                  pages={live.active_shared_live_media.urls.pages}
                >
                  <UpdateCurrentSharedLiveMediaPage />
                </SharedMediaExplorer>
              ) : (
                <Redirect to={FULL_SCREEN_ERROR_ROUTE()} />
              ))
            }
            reversed={pipState.reversed}
            pictureActions={
              pipState.reversed && isParticipantOnstage && jitsiLive
                ? [<AudioControl />, <CameraControl />]
                : undefined
            }
          />
          {live.is_recording && mainElementRef.current && (
            <Layer
              position="top-left"
              modal={false}
              background="transparent"
              target={mainElementRef.current}
            >
              <StudentLiveRecordingInfo />
            </Layer>
          )}
        </Box>
      }
      sideElement={<LiveVideoPanel />}
    />
  );
};

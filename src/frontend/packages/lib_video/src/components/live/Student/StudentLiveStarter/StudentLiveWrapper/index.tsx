import { Box, Layer } from 'grommet';
import { Nullable } from 'lib-common';
import { useAppConfig, useVideo } from 'lib-components';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { pushAttendance } from 'api/pushAttendance';
import { PictureInPictureLayer } from 'components/common/PictureInPictureLayer';
import { VideoLayout } from 'components/common/VideoLayout';
import { VideoPlayer } from 'components/common/VideoPlayer';
import DashboardLiveJitsi from 'components/live/common/DashboardLiveJitsi';
import { AudioControl } from 'components/live/common/JitsiControls/AudioControl';
import { CameraControl } from 'components/live/common/JitsiControls/CameraControl';
import { LiveVideoPanel } from 'components/live/common/LiveVideoPanel';
import { SharedMediaExplorer } from 'components/live/common/SharedMediaExplorer';
import {
  InvalidJitsiLiveException,
  MissingSharedLiveSessionUrls,
} from 'errors';
import { useCurrentLive } from 'hooks/useCurrentVideo';
import { LivePanelItem, useLivePanelState } from 'hooks/useLivePanelState';
import { useParticipantWorkflow } from 'hooks/useParticipantWorkflow';
import { usePictureInPicture } from 'hooks/usePictureInPicture';
import { convertLiveToJitsiLive } from 'utils/convertVideo';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';

import { StudentLiveControlBar } from './StudentLiveControlBar';
import { StudentLiveInfoBar } from './StudentLiveInfoBar';
import { StudentLiveRecordingInfo } from './StudentLiveRecordingInfo';
import { UpdateCurrentSharedLiveMediaPage } from './UpdateCurrentSharedLiveMediaPage';

interface StudentLiveWrapperProps {
  playerType: string;
}

export const StudentLiveWrapper: React.FC<StudentLiveWrapperProps> = ({
  playerType,
}) => {
  const intl = useIntl();
  const appData = useAppConfig();
  const live = useCurrentLive();
  const { isWatchingVideo, id3Video } = useVideo();

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
        pushAttendance(
          live.id,
          attendance,
          intl.locale,
          getOrInitAnonymousId(),
        );
      }, appData.attendanceDelay);
      return () => {
        // Stop tracking attendances as we unmount
        window.clearInterval(interval);
      };
    }

    return;
  }, [isParticipantOnstage, intl.locale, appData, live.id]);

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
  }, [configPanel, currentItem, live.has_chat, live.xmpp]);

  // show panel only when user first time comes on the live
  useEffect(() => {
    if (live.xmpp && currentItem && showPanelTrigger) {
      setPanelVisibility(true);
      setShowPanelTrigger(false);
    }
  }, [live.xmpp, currentItem, showPanelTrigger, setPanelVisibility]);

  const jitsiLive = convertLiveToJitsiLive(live);
  if (isParticipantOnstage && !jitsiLive) {
    throw new InvalidJitsiLiveException(
      'Student is on stage but live is not a jitsi live.',
    );
  }

  let secondElement: ReactNode;
  if (
    !isWatchingVideo &&
    live.active_shared_live_media &&
    live.active_shared_live_media_page
  ) {
    if (!live.active_shared_live_media.urls) {
      throw new MissingSharedLiveSessionUrls(
        'Missing shared live session urls during a sharing.',
      );
    }

    secondElement = (
      <SharedMediaExplorer
        initialPage={live.active_shared_live_media_page}
        pages={live.active_shared_live_media.urls.pages}
      >
        <UpdateCurrentSharedLiveMediaPage />
      </SharedMediaExplorer>
    );
  }

  if (
    isWatchingVideo &&
    id3Video?.active_shared_live_media?.id &&
    id3Video.active_shared_live_media_page
  ) {
    const pages = live.shared_live_medias.find(
      (media) => media.id === id3Video.active_shared_live_media?.id,
    )?.urls?.pages;
    const pageNumber = id3Video.active_shared_live_media_page;

    if (!pages) {
      throw new MissingSharedLiveSessionUrls(
        'Missing shared live session urls during a sharing.',
      );
    }

    secondElement = (
      <SharedMediaExplorer initialPage={pageNumber} pages={pages}>
        <UpdateCurrentSharedLiveMediaPage />
      </SharedMediaExplorer>
    );
  }

  return (
    <VideoLayout
      isLive
      actionsElement={<StudentLiveControlBar />}
      displayActionsElement={!!live.xmpp}
      isXmppReady={!!live.xmpp}
      liveTitleElement={<StudentLiveInfoBar startDate={live.starting_at} />}
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
            secondElement={secondElement}
            reversed={pipState.reversed}
            pictureActions={
              pipState.reversed && isParticipantOnstage && jitsiLive
                ? [
                    <AudioControl key="audio-control" />,
                    <CameraControl key="camera-control" />,
                  ]
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
      sideElement={<LiveVideoPanel isLive />}
    />
  );
};

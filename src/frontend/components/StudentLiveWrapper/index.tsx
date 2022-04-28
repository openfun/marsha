import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ConverseInitializer } from 'components/ConverseInitializer';
import DashboardVideoLiveJitsi from 'components/DashboardVideoLiveJitsi';
import { LiveVideoLayout } from 'components/LiveVideoLayout';
import { LiveVideoPanel } from 'components/LiveVideoPanel';
import { StudentLiveAdvertising } from 'components/StudentLiveAdvertising';
import { StudentLiveControlBar } from 'components/StudentLiveControlBar';
import { StudentLiveInfoBar } from 'components/StudentLiveInfoBar';
import VideoPlayer from 'components/VideoPlayer';
import { pollForLive } from 'data/sideEffects/pollForLive';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { useLiveStateStarted } from 'data/stores/useLiveStateStarted';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { liveState, Video } from 'types/tracks';

const messages = defineMessages({
  defaultLiveTitle: {
    defaultMessage: 'No title',
    description:
      'Default live title for students (if the live has no title set)',
    id: 'components.StudentLiveWrapper.defaultLiveTitle',
  },
});

interface StudentLiveWrapperProps {
  video: Video;
  playerType: string;
}

export const StudentLiveWrapper: React.FC<StudentLiveWrapperProps> = ({
  video,
  playerType,
}) => {
  const intl = useIntl();
  const { isPanelVisible, configPanel, currentItem, setPanelVisibility } =
    useLivePanelState((state) => ({
      isPanelVisible: state.isPanelVisible,
      configPanel: state.setAvailableItems,
      currentItem: state.currentItem,
      setPanelVisibility: state.setPanelVisibility,
    }));
  const { isStarted, setIsLiveStarted } = useLiveStateStarted((state) => ({
    isStarted: state.isStarted,
    setIsLiveStarted: state.setIsStarted,
  }));
  const isParticipantOnstage = useParticipantWorkflow(
    (state) => state.accepted,
  );
  const [showPanelTrigger, setShowPanelTrigger] = useState(true);

  useEffect(() => {
    // if the xmpp object is not null, panel state is filled
    if (video.xmpp !== null) {
      const items = [];
      if (video.has_chat) {
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
  }, [video.xmpp]);

  // show panel only when user first time comes on the live
  useEffect(() => {
    if (video.xmpp && isStarted && currentItem && showPanelTrigger) {
      setPanelVisibility(true);
      setShowPanelTrigger(false);
    }
  }, [video.xmpp, isStarted, currentItem, showPanelTrigger]);

  useEffect(() => {
    let canceled = false;
    const poll = async () => {
      if (
        isStarted ||
        !video.urls ||
        !video.live_state ||
        [liveState.IDLE, liveState.STARTING].includes(video.live_state)
      ) {
        return;
      }

      await pollForLive(video.urls);
      if (canceled) {
        return;
      }

      setIsLiveStarted(true);
    };

    poll();
    return () => {
      canceled = true;
    };
  }, [video, isStarted]);

  if (!isStarted && !isParticipantOnstage) {
    return <StudentLiveAdvertising video={video} />;
  }

  return (
    <ConverseInitializer video={video}>
      <LiveVideoLayout
        actionsElement={<StudentLiveControlBar video={video} />}
        displayActionsElement={!!video.xmpp}
        isPanelOpen={isPanelVisible}
        isXmppReady={!!video.xmpp}
        liveTitleElement={
          <StudentLiveInfoBar
            title={video.title ?? intl.formatMessage(messages.defaultLiveTitle)}
            startDate={null}
          />
        }
        mainElement={
          isParticipantOnstage ? (
            <DashboardVideoLiveJitsi video={video} />
          ) : (
            <VideoPlayer
              playerType={playerType}
              timedTextTracks={[]}
              video={video}
            />
          )
        }
        sideElement={<LiveVideoPanel video={video} />}
      />
    </ConverseInitializer>
  );
};

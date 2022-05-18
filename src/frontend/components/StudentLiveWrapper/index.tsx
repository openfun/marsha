import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ConverseInitializer } from 'components/ConverseInitializer';
import DashboardVideoLiveJitsi from 'components/DashboardVideoLiveJitsi';
import { LiveVideoLayout } from 'components/LiveVideoLayout';
import { LiveVideoPanel } from 'components/LiveVideoPanel';
import { StudentLiveControlBar } from 'components/StudentLiveControlBar';
import { StudentLiveInfoBar } from 'components/StudentLiveInfoBar';
import VideoPlayer from 'components/VideoPlayer';
import { pushAttendance } from 'data/sideEffects/pushAttendance';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { PUSH_ATTENDANCE_DELAY } from 'default/sideEffects';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';
import { Video } from 'types/tracks';

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
  const isParticipantOnstage = useParticipantWorkflow(
    (state) => state.accepted,
  );
  const [showPanelTrigger, setShowPanelTrigger] = useState(true);

  useEffect(() => {
    if (isParticipantOnstage) {
      const interval = window.setInterval(() => {
        const attendance = {
          [Date.now()]: {
            onStage: true,
          },
        };
        pushAttendance(attendance, intl.locale, getOrInitAnonymousId());
      }, PUSH_ATTENDANCE_DELAY);
      return () => {
        // Stop tracking attendances as we unmount
        window.clearInterval(interval);
      };
    }
  }, [isParticipantOnstage, intl.locale]);

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
    if (video.xmpp && currentItem && showPanelTrigger) {
      setPanelVisibility(true);
      setShowPanelTrigger(false);
    }
  }, [video.xmpp, currentItem, showPanelTrigger]);

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

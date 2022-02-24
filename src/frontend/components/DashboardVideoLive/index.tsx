import { Box } from 'grommet';
import React, { Fragment, useEffect, useState } from 'react';

import { DashboardVideoLivePairing } from 'components/DashboardVideoLivePairing';
import { DashboardVideoLiveRunning } from 'components/DashboardVideoLiveRunning';
import { LiveVideoLayout } from 'components/LiveVideoLayout';
import { LiveVideoPanel } from 'components/LiveVideoPanel';
import { ScheduledVideoForm } from 'components/ScheduledVideoForm';
import { TeacherLiveContent } from 'components/TeacherLiveContent';
import { TeacherLiveLifecycleControls } from 'components/TeacherLiveLifecycleControls';
import { TeacherLiveControlBar } from 'components/TeacherLiveControlBar';
import { TeacherLiveInfoBar } from 'components/TeacherLiveInfoBar';
import { TeacherLiveTypeSwitch } from 'components/TeacherLiveTypeSwitch';
import { appData } from 'data/appData';
import { LiveFeedbackProvider } from 'data/stores/useLiveFeedback';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { StopLiveConfirmationProvider } from 'data/stores/useStopLiveConfirmation';
import { Video, liveState, LiveModeType } from 'types/tracks';

interface DashboardVideoLiveProps {
  video: Video;
}

export const DashboardVideoLive = ({ video }: DashboardVideoLiveProps) => {
  const { isPanelVisible, configPanel } = useLivePanelState((state) => ({
    isPanelVisible: state.isPanelVisible,
    configPanel: state.setAvailableItems,
  }));
  const [canStartLive, setCanStartLive] = useState(
    video.live_type === LiveModeType.RAW,
  );
  const [canShowStartButton, setCanShowStartButton] = useState(
    video.live_type === LiveModeType.RAW,
  );

  useEffect(() => {
    const availableItems: LivePanelItem[] = [];
    let currentItem;
    if (video.xmpp !== null) {
      availableItems.push(LivePanelItem.CHAT);
      availableItems.push(LivePanelItem.VIEWERS_LIST);
      currentItem = LivePanelItem.CHAT;
    }
    configPanel(availableItems, currentItem);
  }, [video, configPanel]);

  //  When the live is started,
  //  XMPP is ready to be used and therefore we can show chat and viewers buttons
  const isLiveStarted =
    video.live_state !== undefined && video.live_state !== liveState.IDLE;

  return (
    <LiveFeedbackProvider value={false}>
      <StopLiveConfirmationProvider value={false}>
        <Box>
          <LiveVideoLayout
            actionsElement={
              <Fragment>
                {isLiveStarted && <TeacherLiveControlBar video={video} />}
                <TeacherLiveLifecycleControls
                  canStartStreaming={canShowStartButton}
                  hasRightToStart={canStartLive}
                  video={video}
                />
              </Fragment>
            }
            displayActionsElement
            isPanelOpen={isPanelVisible}
            liveTitleElement={
              <TeacherLiveInfoBar title={video.title} startDate={null} />
            }
            mainElement={
              <TeacherLiveContent
                setCanShowStartButton={setCanShowStartButton}
                setCanStartLive={setCanStartLive}
                video={video}
              />
            }
            sideElement={<LiveVideoPanel video={video} />}
          />

          <Box direction={'row'} justify={'center'} margin={'small'}>
            {appData.flags?.live_raw &&
              video.live_state &&
              [liveState.IDLE, liveState.PAUSED].includes(video.live_state) && (
                <TeacherLiveTypeSwitch video={video} />
              )}
            {video.live_state === liveState.RUNNING && (
              <DashboardVideoLiveRunning video={video} />
            )}
          </Box>

          {video.live_state !== liveState.STOPPED && (
            <Box direction={'row'} justify={'center'} margin={'small'}>
              <DashboardVideoLivePairing video={video} />
            </Box>
          )}
          {video.live_state === liveState.IDLE && (
            <ScheduledVideoForm video={video} />
          )}
        </Box>
      </StopLiveConfirmationProvider>
    </LiveFeedbackProvider>
  );
};

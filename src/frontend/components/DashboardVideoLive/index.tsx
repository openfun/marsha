import { Box } from 'grommet';
import React, { Fragment, useEffect, useState } from 'react';

import { ConverseInitializer } from 'components/ConverseInitializer';
import { DashboardVideoLiveControlPane } from 'components/DashboardVideoLiveControlPane';
import { DashboardVideoLivePairing } from 'components/DashboardVideoLivePairing';
import { LiveVideoLayout } from 'components/LiveVideoLayout';
import { LiveVideoPanel } from 'components/LiveVideoPanel';
import { TeacherLiveContent } from 'components/TeacherLiveContent';
import { TeacherLiveLifecycleControls } from 'components/TeacherLiveLifecycleControls';
import { TeacherLiveControlBar } from 'components/TeacherLiveControlBar';
import { TeacherLiveInfoBar } from 'components/TeacherLiveInfoBar';
import { TeacherLiveRecordingActions } from 'components/TeacherLiveRecordingActions';
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
  const { isPanelVisible, configPanel, currentItem } = useLivePanelState(
    (state) => ({
      isPanelVisible: state.isPanelVisible,
      configPanel: state.setAvailableItems,
      currentItem: state.currentItem,
    }),
  );
  const [canStartLive, setCanStartLive] = useState(
    video.live_type === LiveModeType.RAW,
  );
  const [canShowStartButton, setCanShowStartButton] = useState(
    video.live_type === LiveModeType.RAW,
  );

  useEffect(() => {
    // if the xmpp object is not null, panel state is filled
    if (video.xmpp !== null) {
      configPanel(
        [LivePanelItem.CHAT, LivePanelItem.VIEWERS_LIST],
        // If the panel has a previous selected tab, it is this one which is used
        currentItem ? currentItem : LivePanelItem.CHAT,
      );
    }
    // if the xmpp object becomes unavailable, panel is uninitialized (but selected tab stays unchanged)
    else {
      configPanel([]);
    }
  }, [video, configPanel]);

  //  When the live is started,
  //  XMPP is ready to be used and therefore we can show chat and viewers buttons
  const isLiveStarted =
    video.live_state !== undefined && video.live_state !== liveState.IDLE;

  return (
    <ConverseInitializer video={video}>
      <LiveFeedbackProvider value={false}>
        <StopLiveConfirmationProvider value={false}>
          <LiveVideoLayout
            actionsElement={
              <Fragment>
                {isLiveStarted && <TeacherLiveControlBar video={video} />}
                <Box flex={isLiveStarted} direction="row">
                  <TeacherLiveRecordingActions
                    isJitsiAdministrator={canStartLive}
                    video={video}
                  />
                  <TeacherLiveLifecycleControls
                    canStartStreaming={canShowStartButton}
                    flex={isLiveStarted ? { grow: 1, shrink: 1 } : false}
                    hasRightToStart={canStartLive}
                    video={video}
                  />
                </Box>
              </Fragment>
            }
            additionalContent={
              <Box background="bg-marsha">
                <Box direction={'row'} justify={'center'} margin={'small'}>
                  {appData.flags?.live_raw &&
                    video.live_state &&
                    [liveState.IDLE, liveState.PAUSED].includes(
                      video.live_state,
                    ) && <TeacherLiveTypeSwitch video={video} />}
                </Box>

                {video.live_state !== liveState.STOPPED && (
                  <Box direction={'row'} justify={'center'} margin={'small'}>
                    <DashboardVideoLivePairing video={video} />
                  </Box>
                )}
                <DashboardVideoLiveControlPane video={video} />
              </Box>
            }
            displayActionsElement
            isPanelOpen={isPanelVisible}
            isXmppReady={!!video.xmpp}
            liveTitleElement={
              <TeacherLiveInfoBar
                flex={isLiveStarted ? { grow: 1, shrink: 2 } : true}
                title={video.title}
                startDate={null}
              />
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
        </StopLiveConfirmationProvider>
      </LiveFeedbackProvider>
    </ConverseInitializer>
  );
};

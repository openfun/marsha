import { Box } from 'grommet';
import React, { Fragment, useEffect, useState } from 'react';

import { ConverseInitializer } from 'components/ConverseInitializer';
import { DashboardVideoLiveControlPane } from 'components/DashboardVideoLiveControlPane';
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
import { LiveModaleConfigurationProvider } from 'data/stores/useLiveModale';
import { Video, liveState, LiveModeType } from 'types/tracks';
import { PictureInPictureLayer } from 'components/PictureInPictureLayer';
import { usePictureInPicture } from 'data/stores/usePictureInPicture';
import { SharedMediaExplorer } from 'components/SharedMediaExplorer';
import { Redirect } from 'react-router-dom';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { TeacherPIPControls } from './TeacherPIPControls';
import { AudioControl } from 'components/JitsiControls/AudioControl';
import { CameraControl } from 'components/JitsiControls/CameraControl';
import { useJitsiApi } from 'data/stores/useJitsiApi';
import { toolbarButtons } from 'components/DashboardVideoLiveJitsi/utils';

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
  const [pipState] = usePictureInPicture();
  const [jitsiApi] = useJitsiApi();

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
        // If the panel has a previous selected tab, it is this one which is used
        currentItem ? currentItem : LivePanelItem.CHAT,
      );
    }
    // if the xmpp object becomes unavailable, panel is uninitialized (but selected tab stays unchanged)
    else {
      configPanel([]);
    }
  }, [video, configPanel]);

  useEffect(() => {
    if (jitsiApi && pipState.reversed) {
      jitsiApi.executeCommand('overwriteConfig', {
        toolbarButtons: [],
      });
    } else if (jitsiApi) {
      jitsiApi.executeCommand('overwriteConfig', {
        toolbarButtons: toolbarButtons,
      });
    }
  }, [pipState, jitsiApi]);

  //  When the live is started,
  //  XMPP is ready to be used and therefore we can show chat and viewers buttons
  const isLiveStarted =
    video.live_state !== undefined && video.live_state !== liveState.IDLE;

  return (
    <ConverseInitializer video={video}>
      <LiveFeedbackProvider value={false}>
        <LiveModaleConfigurationProvider value={null}>
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
              <Fragment>
                {appData.flags?.live_raw &&
                  video.live_state &&
                  [liveState.IDLE, liveState.STOPPED].includes(
                    video.live_state,
                  ) && (
                    <Box direction={'row'} justify={'center'} margin={'small'}>
                      <TeacherLiveTypeSwitch video={video} />
                    </Box>
                  )}
                <DashboardVideoLiveControlPane video={video} />
              </Fragment>
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
              <PictureInPictureLayer
                mainElement={
                  <TeacherLiveContent
                    setCanShowStartButton={setCanShowStartButton}
                    setCanStartLive={setCanStartLive}
                    video={video}
                  />
                }
                secondElement={
                  video.active_shared_live_media ? (
                    video.active_shared_live_media.urls ? (
                      <SharedMediaExplorer
                        initialPage={1}
                        pages={video.active_shared_live_media.urls.pages}
                      >
                        {video.active_shared_live_media.nb_pages &&
                          video.active_shared_live_media.nb_pages > 1 && (
                            <TeacherPIPControls
                              video={video}
                              maxPage={video.active_shared_live_media.nb_pages}
                            />
                          )}
                      </SharedMediaExplorer>
                    ) : (
                      <Redirect to={FULL_SCREEN_ERROR_ROUTE()} />
                    )
                  ) : null
                }
                reversed={pipState.reversed}
                pictureActions={
                  pipState.reversed
                    ? [<AudioControl />, <CameraControl />]
                    : undefined
                }
              />
            }
            sideElement={<LiveVideoPanel video={video} />}
          />
        </LiveModaleConfigurationProvider>
      </LiveFeedbackProvider>
    </ConverseInitializer>
  );
};

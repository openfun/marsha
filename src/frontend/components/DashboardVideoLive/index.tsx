import { Box, Heading, Text } from 'grommet';
import React, { lazy, useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { appData } from '../../data/appData';
import { useVideo } from '../../data/stores/useVideo';
import { API_ENDPOINT } from '../../settings';
import { modelName } from '../../types/models';
import { Video, liveState, LiveModeType } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { CHAT_ROUTE } from '../Chat/route';
import { PLAYER_ROUTE } from '../routes';
import { DashboardVideoLiveStartButton } from '../DashboardVideoLiveStartButton';
import { DashboardVideoLiveStopButton } from '../DashboardVideoLiveStopButton';
import { DashboardButtonWithLink } from '../DashboardPaneButtons';

const DashboardVideoLiveRaw = lazy(() => import('../DashboardVideoLiveRaw'));
const DashboardVideoLiveJitsi = lazy(
  () => import('../DashboardVideoLiveJitsi'),
);

const messages = defineMessages({
  raw: {
    defaultMessage: 'Streaming link',
    description: 'DashboardVideoLive main title.',
    id: 'components.DashboardVideoLive.raw',
  },
  jitsi: {
    defaultMessage: 'Jitsi Streaming',
    description: 'DashboardVideoLive jitsi title.',
    id: 'components.DashboardVideoLive.jitsi',
  },
  url: {
    defaultMessage: 'url',
    description: 'Video url streaming.',
    id: 'components.DashboardVideoLive.url',
  },
  showLive: {
    defaultMessage: 'show live',
    description: 'button to redirect use to video player.',
    id: 'components.DashboardVideoLive.showLive',
  },
  chatOnly: {
    defaultMessage: 'show chat only',
    description: 'button to redirect to the chat only view.',
    id: 'components.DashboardVideoLive.chatOnly',
  },
  liveCreating: {
    defaultMessage:
      'Live streaming is being created. You will be able to start it in a few seconds',
    description: 'Helptext explainig to wait until the live is created.',
    id: 'components.DashboardVideoLive.liveCreating',
  },
  liveStarting: {
    defaultMessage:
      'Live streaming is starting. Wait before starting your stream.',
    description: 'Helptext explainig to wait until the live is ready.',
    id: 'components.DashboardVideoLive.liveStarting',
  },
  liveStopped: {
    defaultMessage:
      'Live streaming is ended. The process to transform the live to VOD has started. You can close the window and come back later.',
    description:
      'Helptext explaining that the live is ended and the live to VOD process has started.',
    id: 'components.DashboardVideoLive.liveStopped',
  },
  liveStopping: {
    defaultMessage:
      'Live streaming is ending. The process to transform the live to VOD will begin soon. You can close the window and come back later.',
    description:
      'Helptext explaining that the live is ending and the live to VOD process will start.',
    id: 'components.DashboardVideoLive.liveStopping',
  },
});

interface DashboardVideoLiveProps {
  video: Video;
}

export const DashboardVideoLive = ({ video }: DashboardVideoLiveProps) => {
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));
  const pollForVideo = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/videos/${video.id}/`, {
        headers: {
          Authorization: `Bearer ${appData.jwt}`,
        },
      });

      const incomingVideo: Video = await response.json();

      if (
        incomingVideo.live_state === liveState.RUNNING ||
        incomingVideo.live_state === liveState.IDLE
      ) {
        updateVideo(incomingVideo);
      }
    } catch (error) {
      report(error);
    }
  };

  useEffect(() => {
    const intervalMs = {
      [liveState.STARTING]: 15000,
      [liveState.CREATING]: 2000,
    };
    if (
      video.live_state === liveState.STARTING ||
      video.live_state === liveState.CREATING
    ) {
      const interval = setInterval(pollForVideo, intervalMs[video.live_state]);
      return () => clearInterval(interval);
    }
  }, [video.live_state]);

  return (
    <Box>
      <Heading level={2}>
        <FormattedMessage {...messages[video.live_info.type!]} />
      </Heading>
      {video.live_info.type === LiveModeType.RAW && (
        <DashboardVideoLiveRaw video={video} />
      )}
      {video.live_info.type === LiveModeType.JITSI && (
        <DashboardVideoLiveJitsi video={video} />
      )}
      <Box direction={'row'} justify={'center'} margin={'small'}>
        {video.live_state === liveState.CREATING && (
          <Text>
            <FormattedMessage {...messages.liveCreating} />
          </Text>
        )}
        {video.live_state === liveState.IDLE && (
          <DashboardVideoLiveStartButton video={video} />
        )}
        {video.live_state === liveState.STARTING && (
          <Text>
            <FormattedMessage {...messages.liveStarting} />
          </Text>
        )}
        {video.live_state === liveState.RUNNING && (
          <React.Fragment>
            {video.live_info.type === LiveModeType.RAW && (
              <React.Fragment>
                <DashboardButtonWithLink
                  label={<FormattedMessage {...messages.chatOnly} />}
                  primary={false}
                  to={CHAT_ROUTE()}
                />
                <DashboardButtonWithLink
                  label={<FormattedMessage {...messages.showLive} />}
                  primary={false}
                  to={PLAYER_ROUTE(modelName.VIDEOS)}
                />
              </React.Fragment>
            )}
            <DashboardVideoLiveStopButton video={video} />
          </React.Fragment>
        )}
        {video.live_state === liveState.STOPPED && (
          <Text>
            <FormattedMessage {...messages.liveStopped} />
          </Text>
        )}
        {video.live_state === liveState.STOPPING && (
          <Text>
            <FormattedMessage {...messages.liveStopping} />
          </Text>
        )}
      </Box>
    </Box>
  );
};

import { Box, Heading, Text } from 'grommet';
import React, { lazy, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { appData } from '../../data/appData';
import { useVideo } from '../../data/stores/useVideo';
import { API_ENDPOINT } from '../../settings';
import { Video, liveState, LiveModeType } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { DashboardVideoLiveEndButton } from '../DashboardVideoLiveEndButton';
import { DashboardVideoLiveStartButton } from '../DashboardVideoLiveStartButton';
import { DashboardVideoLiveRunning } from '../DashboardVideoLiveRunning';
import { DashboardVideoLiveConfigureButton } from '../DashboardVideoLiveConfigureButton';

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
    defaultMessage: 'Webinar',
    description: 'DashboardVideoLive jitsi title.',
    id: 'components.DashboardVideoLive.jitsi',
  },
  url: {
    defaultMessage: 'url',
    description: 'Video url streaming.',
    id: 'components.DashboardVideoLive.url',
  },
  liveStarting: {
    defaultMessage: 'Live streaming is starting. This can take a few minutes.',
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
      'Pause live streaming, please wait a few moments to be able to resume it.',
    description:
      'Helptext explaining that the live is stopping and will be paused in few moments.',
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
  const [canStartLive, setCanStartLive] = useState(false);
  const [canShowStartButton, setCanShowStartButton] = useState(false);
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
        incomingVideo.live_state === liveState.IDLE ||
        incomingVideo.live_state === liveState.PAUSED
      ) {
        updateVideo(incomingVideo);
      }
    } catch (error) {
      report(error);
    }
  };

  useEffect(() => {
    if ([liveState.STARTING, liveState.STOPPING].includes(video.live_state!)) {
      const interval = setInterval(pollForVideo, 15000);
      return () => clearInterval(interval);
    }
  }, [video.live_state]);

  useEffect(() => {
    if (video.live_type === LiveModeType.RAW) {
      setCanStartLive(true);
      setCanShowStartButton(true);
    }
  }, []);

  return (
    <Box>
      <Heading level={2}>
        <FormattedMessage {...messages[video.live_type!]} />
      </Heading>
      {video.live_type === LiveModeType.RAW && (
        <DashboardVideoLiveRaw video={video} />
      )}
      {video.live_type === LiveModeType.JITSI && (
        <DashboardVideoLiveJitsi
          video={video}
          setCanShowStartButton={setCanShowStartButton}
          setCanStartLive={setCanStartLive}
          isInstructor={true}
        />
      )}
      <Box direction={'row'} justify={'center'} margin={'small'}>
        {[liveState.IDLE, liveState.PAUSED].includes(video.live_state!) && (
          <React.Fragment>
            {video.live_type === LiveModeType.RAW && (
              <DashboardVideoLiveConfigureButton
                video={video}
                type={LiveModeType.JITSI}
              />
            )}
            {canShowStartButton && (
              <React.Fragment>
                <DashboardVideoLiveEndButton video={video} />
                <DashboardVideoLiveStartButton
                  video={video}
                  canStartLive={canStartLive}
                />
              </React.Fragment>
            )}
          </React.Fragment>
        )}
        {video.live_state === liveState.STARTING && (
          <Text>
            <FormattedMessage {...messages.liveStarting} />
          </Text>
        )}
        {video.live_state === liveState.RUNNING && (
          <DashboardVideoLiveRunning video={video} />
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

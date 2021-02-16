import { Box, Heading, Text } from 'grommet';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { appData } from '../../data/appData';
import { useVideo } from '../../data/stores/useVideo';
import { API_ENDPOINT } from '../../settings';
import { ModelName } from '../../types/models';
import { Video, LiveState } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { PLAYER_ROUTE } from '../routes';
import { DashboardVideoLiveStartButton } from '../DashboardVideoLiveStartButton';
import { DashboardVideoLiveStopButton } from '../DashboardVideoLiveStopButton';
import { DashboardButtonWithLink } from '../DashboardPaneButtons';

const messages = defineMessages({
  title: {
    defaultMessage: 'Streaming link',
    description: 'DashboardVideoLive main title.',
    id: 'components.DashboardVideoLive.title',
  },
  streamLink: {
    defaultMessage: 'Stream link',
    description: 'link to use to stream a video.',
    id: 'components.DashboardVideoLive.streamLink',
  },
  url: {
    defaultMessage: 'url',
    description: 'Video url streaming.',
    id: 'components.DashboardVideoLive.url',
  },
  streamKey: {
    defaultMessage: 'stream key',
    description: 'Video key streaming.',
    id: 'components.DashboardVideoLive.streamKey',
  },
  showLive: {
    defaultMessage: 'show live',
    description: 'button to redirect use to video player.',
    id: 'components.DashboardVideoLive.showLive',
  },
  liveStarting: {
    defaultMessage:
      'Live streaming is starting. Wait before starting your stream.',
    description: 'Helptext explainig to wait until the live is ready.',
    id: 'components.DashboardVideoLive.liveStarting',
  },
  liveStopped: {
    defaultMessage:
      'Live streaming is ended. The process to transform the live in VOD will begin soon.',
    description:
      'Helptext explaining that the live is ended and the live to VOD process will start.',
    id: 'components.DashboardVideoLive.liveStopped',
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

      if (incomingVideo.live_state === LiveState.RUNNING) {
        updateVideo(incomingVideo);
      }
    } catch (error) {
      report(error);
    }
  };

  useEffect(() => {
    if (video.live_state === LiveState.STARTING) {
      const interval = setInterval(pollForVideo, 15_000);
      return () => clearInterval(interval);
    }
  }, [video.live_state]);

  const endpointIdentifier = /^(rtmp:\/\/.*)\/(.*)$/;
  const endpoints = video.live_info.medialive!.input.endpoints.map(
    (endpoint) => {
      const matches = endpoint.match(endpointIdentifier);
      if (matches) {
        return (
          <Box key={matches[2]}>
            <Heading level={4}>
              <FormattedMessage {...messages.streamLink} />
            </Heading>
            <ul>
              <li>
                <FormattedMessage {...messages.url} />: {matches[1]}
              </li>
              <li>
                <FormattedMessage {...messages.streamKey} />: {matches[2]}
              </li>
            </ul>
          </Box>
        );
      }

      return null;
    },
  );

  return (
    <Box>
      <Heading level={2}>
        <FormattedMessage {...messages.title} />
      </Heading>
      <Box>{endpoints}</Box>
      <Box direction="row" justify="center" margin="small">
        {video.live_state === LiveState.IDLE && (
          <DashboardVideoLiveStartButton video={video} />
        )}
        {video.live_state === LiveState.STARTING && (
          <Text>
            <FormattedMessage {...messages.liveStarting} />
          </Text>
        )}
        {video.live_state === LiveState.RUNNING && (
          <React.Fragment>
            <DashboardButtonWithLink
              label={<FormattedMessage {...messages.showLive} />}
              primary={false}
              to={PLAYER_ROUTE(ModelName.VIDEOS)}
            />
            <DashboardVideoLiveStopButton video={video} />
          </React.Fragment>
        )}
        {video.live_state === LiveState.STOPPED && (
          <Text>
            <FormattedMessage {...messages.liveStopped} />
          </Text>
        )}
      </Box>
    </Box>
  );
};

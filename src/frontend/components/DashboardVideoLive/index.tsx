import ClipboardJS from 'clipboard';
import { Box, Heading, Text } from 'grommet';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import ReactTooltip from 'react-tooltip';
import styled from 'styled-components';

import { appData } from '../../data/appData';
import { useVideo } from '../../data/stores/useVideo';
import { API_ENDPOINT } from '../../settings';
import { modelName } from '../../types/models';
import { Video, liveState } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { CHAT_ROUTE } from '../Chat/route';
import { PLAYER_ROUTE } from '../routes';
import { DashboardVideoLiveStartButton } from '../DashboardVideoLiveStartButton';
import { DashboardVideoLiveStopButton } from '../DashboardVideoLiveStopButton';
import { DashboardButtonWithLink } from '../DashboardPaneButtons';

const messages = defineMessages({
  copied: {
    defaultMessage: 'Copied!',
    description: 'Message displayed when endpoints info are copied.',
    id: 'components.DashboardVideoLive.copied',
  },
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

const IconBox = styled.span`
  font-size: 18px;
`;

const CopyButton = styled.button`
  border: none;
  cursor: pointer;
`;

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

  useEffect(() => {
    const clipboard = new ClipboardJS('.copy');
    clipboard.on('success', (event) => {
      setTimeout(() => ReactTooltip.hide(event.trigger), 1000);

      event.clearSelection();
    });

    clipboard.on('error', (event) => {
      ReactTooltip.hide(event.trigger);
    });

    return clipboard.destroy;
  }, []);

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
                <FormattedMessage {...messages.url} />
                :&nbsp;
                <span id={`url-${matches[2]}`}>{matches[1]}</span>
                <CopyButton
                  data-tip
                  aria-label={`copy url ${matches[1]}`}
                  className="copy"
                  data-clipboard-target={`#url-${matches[2]}`}
                >
                  <IconBox className="icon-copy" />
                </CopyButton>
              </li>
              <li>
                <FormattedMessage {...messages.streamKey} />
                :&nbsp;
                <span id={`key-${matches[2]}`}>{matches[2]}</span>
                <CopyButton
                  data-tip
                  aria-label={`copy key ${matches[2]}`}
                  className="copy"
                  data-clipboard-target={`#key-${matches[2]}`}
                >
                  <IconBox className="icon-copy" />
                </CopyButton>
              </li>
            </ul>
          </Box>
        );
      }
    },
  );

  return (
    <Box>
      <Heading level={2}>
        <FormattedMessage {...messages.title} />
      </Heading>
      <Box>
        {endpoints}
        <ReactTooltip
          effect="solid"
          place="bottom"
          type="success"
          isCapture={true}
          event="click"
        >
          <FormattedMessage {...messages.copied} />
        </ReactTooltip>
      </Box>
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

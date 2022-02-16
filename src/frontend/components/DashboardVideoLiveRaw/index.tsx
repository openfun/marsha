import ClipboardJS from 'clipboard';
import { Box, Heading, Paragraph } from 'grommet';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import ReactTooltip from 'react-tooltip';
import styled from 'styled-components';

import { liveState, Video } from 'types/tracks';

const messages = defineMessages({
  copied: {
    defaultMessage: 'Copied!',
    description: 'Message displayed when endpoints info are copied.',
    id: 'components.DashboardVideoLiveRaw.copied',
  },
  streamLink: {
    defaultMessage: 'Stream link',
    description: 'link to use to stream a video.',
    id: 'components.DashboardVideoLiveRaw.streamLink',
  },
  url: {
    defaultMessage: 'url',
    description: 'Video url streaming.',
    id: 'components.DashboardVideoLiveRaw.url',
  },
  streamKey: {
    defaultMessage: 'stream key',
    description: 'Video key streaming.',
    id: 'components.DashboardVideoLiveRaw.streamKey',
  },
  idlingTitle: {
    defaultMessage:
      'You are about to start a live using an external source provider.',
    description:
      'Title to inform user he is using raw mode and have to starts the live using an external tool.',
    id: 'components.DashboardVideoLiveRaw.idlingTitle',
  },
  idlingDescription: {
    defaultMessage:
      'Start the live to access stream enpoint and configure your external tool with it.',
    description:
      'Description to inform user he is using raw mode and have to starts the live using an external tool.',
    id: 'components.DashboardVideoLiveRaw.idlingDescription',
  },
});

const IconBox = styled.span`
  font-size: 18px;
`;

const CopyButton = styled.button`
  border: none;
  cursor: pointer;
`;

export interface DashboardVideoLiveRawProps {
  video: Video;
}

const DashboardVideoLiveRaw = ({ video }: DashboardVideoLiveRawProps) => {
  const intl = useIntl();

  useEffect(() => {
    const clipboard = new ClipboardJS('.copy');
    clipboard.on('success', (event) => {
      setTimeout(() => ReactTooltip.hide(event.trigger), 1000);

      event.clearSelection();
    });

    clipboard.on('error', (event) => {
      ReactTooltip.hide(event.trigger);
    });

    return () => clipboard.destroy();
  }, []);

  if (!video.live_state || video.live_state === liveState.IDLE) {
    return (
      <Box>
        <Paragraph>{intl.formatMessage(messages.idlingTitle)}</Paragraph>
        <Paragraph>{intl.formatMessage(messages.idlingDescription)}</Paragraph>
      </Box>
    );
  }

  const endpointIdentifier = /^(rtmp:\/\/.*)\/(.*)$/;
  const endpoints = video.live_info.medialive?.input.endpoints.map(
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
  );
};

export default DashboardVideoLiveRaw;

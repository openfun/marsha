import {
  Box,
  CopyClipboard,
  Heading,
  Text,
  Video,
  liveState,
} from 'lib-components';
import React, { Fragment } from 'react';
import { toast } from 'react-hot-toast';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  copied: {
    defaultMessage: 'Copied!',
    description: 'Message displayed when endpoints info are copied.',
    id: 'components.DashboardLiveRaw.copied',
  },
  streamLink: {
    defaultMessage: 'Stream link',
    description: 'link to use to stream a video.',
    id: 'components.DashboardLiveRaw.streamLink',
  },
  url: {
    defaultMessage: 'url',
    description: 'Video url streaming.',
    id: 'components.DashboardLiveRaw.url',
  },
  streamKey: {
    defaultMessage: 'stream key',
    description: 'Video key streaming.',
    id: 'components.DashboardLiveRaw.streamKey',
  },
  idlingTitle: {
    defaultMessage:
      'You are about to start a live using an external source provider.',
    description:
      'Title to inform user he is using raw mode and have to starts the live using an external tool.',
    id: 'components.DashboardLiveRaw.idlingTitle',
  },
  idlingDescription: {
    defaultMessage:
      'Start the live to access stream enpoint and configure your external tool with it.',
    description:
      'Description to inform user he is using raw mode and have to starts the live using an external tool.',
    id: 'components.DashboardLiveRaw.idlingDescription',
  },
});

export interface DashboardLiveRawProps {
  video: Video;
}

const DashboardLiveRaw = ({ video }: DashboardLiveRawProps) => {
  const intl = useIntl();

  if (!video.live_state || video.live_state === liveState.IDLE) {
    return (
      <Box>
        <Text type="p">{intl.formatMessage(messages.idlingTitle)}</Text>
        <Text type="p">{intl.formatMessage(messages.idlingDescription)}</Text>
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
                <CopyClipboard
                  copyId={`url-${matches[2]}`}
                  text={
                    <Fragment>
                      <FormattedMessage {...messages.url} />
                      :&nbsp;
                      <span id={`url-${matches[2]}`}>{matches[1]}</span>
                    </Fragment>
                  }
                  textToCopy={matches[1]}
                  title={`copy url ${matches[1]}`}
                  onSuccess={(event) => {
                    toast.success(
                      intl.formatMessage(messages.copied, { text: event.text }),
                    );

                    event.clearSelection();
                  }}
                  onError={(event) => {
                    toast.error(event.text);
                  }}
                />
              </li>
              <li>
                <CopyClipboard
                  copyId={`key-${matches[2]}`}
                  text={
                    <Fragment>
                      <FormattedMessage {...messages.streamKey} />
                      :&nbsp;
                      <span id={`key-${matches[2]}`}>{matches[2]}</span>
                    </Fragment>
                  }
                  textToCopy={matches[2]}
                  title={`copy key ${matches[2]}`}
                  onSuccess={(event) => {
                    toast.success(
                      intl.formatMessage(messages.copied, { text: event.text }),
                    );

                    event.clearSelection();
                  }}
                  onError={(event) => {
                    toast.error(event.text);
                  }}
                />
              </li>
            </ul>
          </Box>
        );
      }

      return undefined;
    },
  );

  return <Box>{endpoints}</Box>;
};

export default DashboardLiveRaw;

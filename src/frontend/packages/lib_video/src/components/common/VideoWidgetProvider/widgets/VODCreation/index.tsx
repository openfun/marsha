import { colorsTokens } from 'lib-common';
import { Box, BoxLoader, FoldableItem, Text, liveState } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

import { HarvestVOD } from './HarvestVOD';
import { PublishVOD } from './PublishVOD';
import { shouldDisplayDefaultMessage } from './utils';

const messages = defineMessages({
  info: {
    defaultMessage: 'This widget allows you to handle live VOD features.',
    description: 'Info of the widget used for live vod.',
    id: 'components.VODCreation.info',
  },
  title: {
    defaultMessage: 'VOD',
    description: 'Title of the widget used for live VOD.',
    id: 'components.VODCreation.title',
  },
  noHarvestMessage: {
    defaultMessage:
      'There is nothing to harvest. To create your video, you have to record your stream.{br}Harvest will be available at the end of the live.',
    description:
      'Message displays in the VOD widget when the is nothing to harvest.',
    id: 'components.VODCreation.noHarvestMessage',
  },
  harvestingInProgress: {
    defaultMessage: 'Harvesting in progress...',
    description: 'Message displays when live is harvesting.',
    id: 'components.VODCreation.harvestingInProgress',
  },
  publishVODMessage: {
    defaultMessage:
      'Your VOD is now available, you can download it to control the content then convert it into VOD.',
    description:
      'Message displayed in the VOD widget when live have been harvested and we can publish the VOD',
    id: 'components.VODCreation.publishVODMessage',
  },
  publishVODButtonLabel: {
    defaultMessage: 'Publish the VOD',
    description: 'Button label to publish the VOD',
    id: 'components.VODCreation.publishVODButtonLabel',
  },
});

export const VODCreation = () => {
  const video = useCurrentVideo();
  const intl = useIntl();

  const displayMessageLayer = shouldDisplayDefaultMessage(video);

  let content;
  if (video.live_state === liveState.HARVESTING) {
    content = (
      <Box fill background="white">
        <Box direction="row" margin="auto" align="center">
          <Text
            color={colorsTokens['info-500']}
            className="mr-s"
            textAlign="center"
          >
            {intl.formatMessage(messages.harvestingInProgress)}
          </Text>
          <BoxLoader size="small" />
        </Box>
      </Box>
    );
  } else if (displayMessageLayer) {
    content = (
      <Box fill background="white">
        <Text color={colorsTokens['info-500']} textAlign="center">
          {intl.formatMessage(messages.noHarvestMessage, { br: <br /> })}
        </Text>
      </Box>
    );
  } else if (video.live_state !== liveState.HARVESTED) {
    content = <HarvestVOD />;
  } else {
    content = <PublishVOD />;
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      {content}
    </FoldableItem>
  );
};

import { Paragraph } from 'grommet';
import { useFetchButton, useVideo } from 'lib-components';
import React, { Fragment, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { harvestLive } from '@lib-video/api/harvestLive';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  harvestLiveMessage: {
    defaultMessage:
      'To transform your recorded session in VOD, you have first to generate it to become available. Then you will be able to download it and convert it in VOD when you will be ready.',
    description:
      'Message displays when we can harvest a live to create the VOD.',
    id: 'components.VODCreation.harvestLiveMessage',
  },
  harvestLiveButtonLabel: {
    defaultMessage: 'Generate file',
    description: 'Label of the button to harvest the live and create the VOD',
    id: 'components.VODCreation.harvestLiveButtonLabel',
  },
});

export const HarvestVOD = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const [state, setState, FetchButton] = useFetchButton();
  const { updateVideo } = useVideo((storeState) => ({
    updateVideo: storeState.addResource,
  }));

  useEffect(() => {
    if (state.type !== 'loading') {
      return;
    }

    let cancel = false;
    const apiCall = async () => {
      try {
        const updatedVideo = await harvestLive(video);
        if (cancel) {
          return;
        }
        setState({ type: 'idle' });
        updateVideo(updatedVideo);
      } catch (error) {
        setState({ type: 'error', error });
      }
    };

    apiCall();
    return () => {
      cancel = true;
    };
  }, [video, state, updateVideo, setState]);

  return (
    <Fragment>
      <Paragraph color="blue-active" textAlign="center">
        {intl.formatMessage(messages.harvestLiveMessage)}
      </Paragraph>
      <FetchButton
        label={intl.formatMessage(messages.harvestLiveButtonLabel)}
        style={{ width: '100%' }}
      />
    </Fragment>
  );
};

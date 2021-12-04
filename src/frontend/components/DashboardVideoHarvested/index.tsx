import { Box } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Navigate } from 'react-router-dom';

import {
  DashboardButton,
  DashboardButtonWithLink,
} from '../DashboardPaneButtons/DashboardButtons';
import { PLAYER_ROUTE } from '../routes';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { updateResource } from '../../data/sideEffects/updateResource';
import { useVideo } from '../../data/stores/useVideo';
import { modelName } from '../../types/models';
import { Video, uploadState } from '../../types/tracks';
import { report } from '../../utils/errors/report';

const messages = defineMessages({
  publish: {
    defaultMessage: 'publish the video',
    description: 'Call to action to publish a live video in VOD',
    id: 'components.DashboardVideoHarvested.publish',
  },
  watch: {
    defaultMessage: 'watch',
    description: 'Button to watch the video.',
    id: 'components.DashboardVideoHarvested.watch',
  },
});

interface DashboardVideoHarvestedProps {
  video: Video;
}

export const DashboardVideoHarvested = ({
  video,
}: DashboardVideoHarvestedProps) => {
  const intl = useIntl();
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));
  const [error, setError] = useState<unknown>();

  const onClick = async () => {
    const updatedVideo = {
      ...video,
      upload_state: uploadState.READY,
    };
    try {
      await updateResource(updatedVideo, modelName.VIDEOS);
      updateVideo(updatedVideo);
    } catch (err) {
      report(err);
      setError(err);
    }
  };

  if (error) {
    return <Navigate to={FULL_SCREEN_ERROR_ROUTE('liveToVod')} />;
  }

  return (
    <Box direction={'row'} justify={'center'} margin={'small'}>
      <DashboardButtonWithLink
        label={intl.formatMessage(messages.watch)}
        to={PLAYER_ROUTE(modelName.VIDEOS)}
      />
      <DashboardButton
        label={intl.formatMessage(messages.publish)}
        onClick={onClick}
        primary
      />
    </Box>
  );
};

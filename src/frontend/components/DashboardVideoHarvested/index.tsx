import { Box } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Redirect } from 'react-router-dom';

import {
  DashboardButton,
  DashboardButtonWithLink,
} from '../DashboardPaneButtons';
import { PLAYER_ROUTE } from '../routes';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { updateResource } from '../../data/sideEffects/updateResource';
import { useVideo } from '../../data/stores/useVideo';
import { ModelName } from '../../types/models';
import { Video, UploadState } from '../../types/tracks';
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
  const [error, setError] = useState();

  const onClick = async () => {
    const updatedVideo = {
      ...video,
      upload_state: UploadState.READY,
    };
    try {
      await updateResource(updatedVideo, ModelName.VIDEOS);
      updateVideo(updatedVideo);
    } catch (err) {
      report(err);
      setError(err);
    }
  };

  if (error) {
    return <Redirect push to={ERROR_COMPONENT_ROUTE('liveToVod')} />;
  }

  return (
    <Box direction="row" justify="center" margin="small">
      <DashboardButtonWithLink
        label={intl.formatMessage(messages.watch)}
        to={PLAYER_ROUTE(ModelName.VIDEOS)}
      />
      <DashboardButton
        label={intl.formatMessage(messages.publish)}
        onClick={onClick}
        primary
      />
    </Box>
  );
};

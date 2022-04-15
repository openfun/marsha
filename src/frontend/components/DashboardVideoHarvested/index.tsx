import { Box } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Redirect } from 'react-router-dom';

import {
  DashboardButton,
  DashboardButtonWithLink,
} from 'components/DashboardPaneButtons/DashboardButtons';
import { PLAYER_ROUTE } from 'components/routes';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { useVideo } from 'data/stores/useVideo';
import { useUpdateVideo } from 'data/queries';
import { modelName } from 'types/models';
import { Video, uploadState } from 'types/tracks';
import { report } from 'utils/errors/report';

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
  const mutation = useUpdateVideo(video.id, {
    onSuccess: (updatedVideo) => {
      updateVideo(updatedVideo);
    },
    onError: (err) => {
      report(err);
      setError(err);
    },
  });

  const onClick = () => {
    mutation.mutate({
      upload_state: uploadState.READY,
    });
  };

  if (error) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('liveToVod')} />;
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

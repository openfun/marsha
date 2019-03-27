import { Box, Button, Text } from 'grommet';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { createThumbnail } from '../../data/sideEffects/createThumbnail/createThumbnail';
import { API_ENDPOINT } from '../../settings';
import { modelName } from '../../types/models';
import { Thumbnail, uploadState, Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { DashboardThumbnailDisplay } from '../DashboardThumbnailDisplay/DashboardThumbnailDisplay';
import { DashboardThumbnailProgressConnected } from '../DashboardThumbnailProgressConnected/DashboardThumbnailProgressConnected';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';

const messages = defineMessages({
  error: {
    defaultMessage: 'There was an error during thumbnail creation.',
    description: 'Generic error message when we fail to create a thumbnail.',
    id: 'components.DashboardThumbnail.error',
  },
  [uploadState.PROCESSING]: {
    defaultMessage:
      'Your thumbnail is currently processing. This may take several minutes. It will appear here once done.',
    description:
      'Thumbnail help text informing that the thumbnail is processing and will be available soon.',
    id: 'components.DashboardThumbnail.helptextProcessing',
  },
  uploadButton: {
    defaultMessage: 'Replace this thumbnail',
    description: '',
    id: 'components.dashboardThumbnail.replaceThumbnailButton',
  },
});

interface DashboardThumbnailProps {
  addThumbnail: (thumbnail: Thumbnail) => void;
  video: Video;
  thumbnail: Nullable<Thumbnail>;
  jwt: string;
}

export const DashboardThumbnail = (props: DashboardThumbnailProps) => {
  const [disabled, setDisabled] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState(null);
  const [pollInterval, setPollInterval] = useState(-1);

  useEffect(() => {
    if (
      props.thumbnail &&
      props.thumbnail.upload_state === uploadState.PROCESSING &&
      pollInterval === -1
    ) {
      setPollInterval(window.setInterval(() => pollThumbnail(), 1000 * 5));
    }

    return function cleanup() {
      if (pollInterval > -1) {
        window.clearInterval(pollInterval);
      }
    };
  });

  const pollThumbnail = async () => {
    try {
      const { addThumbnail, thumbnail, jwt } = props;
      const response = await fetch(
        `${API_ENDPOINT}/thumbnail/${thumbnail!.id}/`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      );

      const incomingThumbnail: Thumbnail = await response.json();
      if (
        incomingThumbnail.is_ready_to_display &&
        incomingThumbnail.upload_state === uploadState.READY
      ) {
        addThumbnail(incomingThumbnail);
      }
    } catch (error) {
      setError(error);
    }
  };

  const prepareUpdate = async () => {
    try {
      setDisabled(true);
      if (props.thumbnail === null) {
        props.addThumbnail(await createThumbnail(props.jwt));
      }

      setRedirect(true);
    } catch (error) {
      setError(error);
    }
  };

  if (redirect) {
    return (
      <Redirect
        push
        to={UPLOAD_FORM_ROUTE(modelName.THUMBNAIL, props.thumbnail!.id)}
      />
    );
  }

  const thumbnailState = props.thumbnail
    ? props.thumbnail.upload_state
    : uploadState.READY;

  switch (thumbnailState) {
    case uploadState.UPLOADING:
      return (
        <Box>
          <DashboardThumbnailProgressConnected
            thumbnailId={props.thumbnail!.id}
          />
        </Box>
      );
    case uploadState.PROCESSING:
      return (
        <Box>
          <Text weight="bold">
            <FormattedMessage {...messages[uploadState.PROCESSING]} />
          </Text>
        </Box>
      );
    case uploadState.ERROR:
      return (
        <Box>
          <Text color="status-error">
            <FormattedMessage {...messages.error} />
          </Text>
        </Box>
      );
    case uploadState.PENDING:
    case uploadState.READY:
      return (
        <Box direction={'column'}>
          <Box>
            <DashboardThumbnailDisplay
              video={props.video}
              thumbnail={props.thumbnail}
            />
          </Box>
          <Box margin={'xsmall'} direction={'column'}>
            <Button
              fill={true}
              label={<FormattedMessage {...messages.uploadButton} />}
              disabled={disabled}
              onClick={prepareUpdate}
            />
            {error && (
              <Box>
                <Text color="status-error">
                  <FormattedMessage {...messages.error} />
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      );
  }
};

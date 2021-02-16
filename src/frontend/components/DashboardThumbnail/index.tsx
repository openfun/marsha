import { Box, Button, Text } from 'grommet';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { appData } from '../../data/appData';
import { createThumbnail } from '../../data/sideEffects/createThumbnail';
import { useThumbnail } from '../../data/stores/useThumbnail';
import { API_ENDPOINT } from '../../settings';
import { ModelName } from '../../types/models';
import { Thumbnail, UploadState, Video } from '../../types/tracks';
import { DashboardObjectProgress } from '../DashboardObjectProgress';
import { DashboardThumbnailDisplay } from '../DashboardThumbnailDisplay';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';

const messages = defineMessages({
  error: {
    defaultMessage: 'There was an error during thumbnail creation.',
    description: 'Generic error message when we fail to create a thumbnail.',
    id: 'components.DashboardThumbnail.error',
  },
  [UploadState.PROCESSING]: {
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
  video: Video;
}

export const DashboardThumbnail = ({ video }: DashboardThumbnailProps) => {
  const [disableUploadBtn, setDisableUploadBtn] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [error, setError] = useState(null);
  const [pollInterval, setPollInterval] = useState(-1);
  const { addThumbnail, thumbnail } = useThumbnail((state) => ({
    addThumbnail: state.addResource,
    thumbnail: state.getThumbnail(),
  }));

  useEffect(() => {
    if (
      thumbnail &&
      thumbnail.upload_state === UploadState.PROCESSING &&
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
      const response = await fetch(
        `${API_ENDPOINT}/${ModelName.THUMBNAILS}/${thumbnail!.id}/`,
        {
          headers: {
            Authorization: `Bearer ${appData.jwt}`,
          },
        },
      );

      const incomingThumbnail: Thumbnail = await response.json();
      if (
        incomingThumbnail.is_ready_to_show &&
        incomingThumbnail.upload_state === UploadState.READY
      ) {
        addThumbnail(incomingThumbnail);
      }
    } catch (err) {
      setError(err);
    }
  };

  const prepareUpdate = async () => {
    try {
      setDisableUploadBtn(true);
      if (thumbnail === null) {
        addThumbnail(await createThumbnail());
      }

      setShouldRedirect(true);
    } catch (err) {
      setError(err);
    }
  };

  if (shouldRedirect) {
    return (
      <Redirect
        push
        to={UPLOAD_FORM_ROUTE(ModelName.THUMBNAILS, thumbnail!.id)}
      />
    );
  }

  const thumbnailState = thumbnail ? thumbnail.upload_state : UploadState.READY;

  switch (thumbnailState) {
    case UploadState.UPLOADING:
      return (
        <Box>
          <DashboardObjectProgress objectId={thumbnail!.id} />
        </Box>
      );
    case UploadState.PROCESSING:
      return (
        <Box>
          <Text weight="bold">
            <FormattedMessage {...messages[UploadState.PROCESSING]} />
          </Text>
        </Box>
      );
    case UploadState.ERROR:
      return (
        <Box>
          <Text color="status-error">
            <FormattedMessage {...messages.error} />
          </Text>
        </Box>
      );
    default:
      return (
        <Box direction="column">
          <Box>
            <DashboardThumbnailDisplay video={video} thumbnail={thumbnail} />
          </Box>
          <Box margin="xsmall" direction="column">
            <Button
              fill={true}
              label={<FormattedMessage {...messages.uploadButton} />}
              disabled={disableUploadBtn}
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

import { Box, Button, Text } from 'grommet';
import React, { useEffect, useRef, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { appData } from '../../data/appData';
import { createThumbnail } from '../../data/sideEffects/createThumbnail';
import { useThumbnail } from '../../data/stores/useThumbnail';
import { API_ENDPOINT } from '../../settings';
import { modelName } from '../../types/models';
import { Thumbnail, uploadState, Video } from '../../types/tracks';
import { DashboardThumbnailDisplay } from '../DashboardThumbnailDisplay';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { UploadableObjectProgress } from '../UploadableObjectProgress';
import { UploadManagerStatus, useUploadManager } from '../UploadManager';

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
  video: Video;
}

export const DashboardThumbnail = ({ video }: DashboardThumbnailProps) => {
  const [disableUploadBtn, setDisableUploadBtn] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [error, setError] = useState(null);
  const pollInterval = useRef(-1);

  const { uploadManagerState } = useUploadManager();
  const { addThumbnail, thumbnail } = useThumbnail((state) => ({
    addThumbnail: state.addResource,
    thumbnail: state.getThumbnail(),
  }));

  const thumbnailState = thumbnail ? thumbnail.upload_state : uploadState.READY;

  const cleanup = () => {
    if (pollInterval.current > -1) {
      window.clearInterval(pollInterval.current);
    }
  };

  useEffect(() => {
    if (
      thumbnail &&
      [uploadState.PROCESSING, uploadState.PENDING].includes(
        thumbnail.upload_state,
      ) &&
      pollInterval.current === -1
    ) {
      pollInterval.current = window.setInterval(
        () => pollThumbnail(),
        1000 * 5,
      );
    }

    return cleanup;
  }, [thumbnailState]);

  const pollThumbnail = async () => {
    try {
      const response = await fetch(
        `${API_ENDPOINT}/${modelName.THUMBNAILS}/${thumbnail!.id}/`,
        {
          headers: {
            Authorization: `Bearer ${appData.jwt}`,
          },
        },
      );

      const incomingThumbnail: Thumbnail = await response.json();
      if (
        incomingThumbnail.is_ready_to_show &&
        incomingThumbnail.upload_state === uploadState.READY
      ) {
        cleanup();
        addThumbnail(incomingThumbnail);
      }
    } catch (error) {
      setError(error);
    }
  };

  const prepareUpdate = async () => {
    try {
      setDisableUploadBtn(true);
      if (thumbnail === null) {
        addThumbnail(await createThumbnail());
      }

      setShouldRedirect(true);
    } catch (error) {
      setError(error);
    }
  };

  if (shouldRedirect) {
    return (
      <Redirect
        push
        to={UPLOAD_FORM_ROUTE(modelName.THUMBNAILS, thumbnail!.id)}
      />
    );
  }

  if (thumbnailState === uploadState.ERROR) {
    return (
      <Box>
        <Text color="status-error">
          <FormattedMessage {...messages.error} />
        </Text>
      </Box>
    );
  }

  if (
    thumbnailState === uploadState.PROCESSING ||
    (thumbnailState === uploadState.PENDING &&
      uploadManagerState[thumbnail!.id]?.status === UploadManagerStatus.SUCCESS)
  ) {
    return (
      <Box>
        <Text weight="bold">
          <FormattedMessage {...messages[uploadState.PROCESSING]} />
        </Text>
      </Box>
    );
  }

  if (
    thumbnailState === uploadState.PENDING &&
    uploadManagerState[thumbnail!.id]?.status === UploadManagerStatus.UPLOADING
  ) {
    return (
      <Box margin={{ vertical: 'small' }}>
        <UploadableObjectProgress objectId={thumbnail!.id} />
      </Box>
    );
  }

  return (
    <Box direction={'column'}>
      <Box>
        <DashboardThumbnailDisplay video={video} thumbnail={thumbnail} />
      </Box>
      <Box margin={'xsmall'} direction={'column'}>
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
};

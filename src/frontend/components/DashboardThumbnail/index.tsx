import { Box, Button, Text } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { DashboardThumbnailDisplay } from 'components/DashboardThumbnailDisplay';
import { UPLOAD_FORM_ROUTE } from 'components/UploadForm/route';
import { UploadableObjectProgress } from 'components/UploadableObjectProgress';
import {
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { createThumbnail } from 'data/sideEffects/createThumbnail';
import { useThumbnail } from 'data/stores/useThumbnail';
import { modelName } from 'types/models';
import { uploadState, Video } from 'types/tracks';

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
  const [error, setError] = useState<unknown>();

  const { uploadManagerState } = useUploadManager();
  const { addThumbnail, thumbnail } = useThumbnail((state) => ({
    addThumbnail: state.addResource,
    thumbnail: state.getThumbnail(),
  }));

  const thumbnailState = thumbnail ? thumbnail.upload_state : uploadState.READY;

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

  if (shouldRedirect && thumbnail) {
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

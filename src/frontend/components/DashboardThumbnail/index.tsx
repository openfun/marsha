import { Box, Button, Text } from 'grommet';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Dispatch } from 'redux';

import { appData } from '../../data/appData';
import { addResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { createThumbnail } from '../../data/sideEffects/createThumbnail';
import { getThumbnail } from '../../data/thumbnail/selector';
import { API_ENDPOINT } from '../../settings';
import { modelName } from '../../types/models';
import { Thumbnail, uploadState, Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { DashboardObjectProgress } from '../DashboardObjectProgress';
import { DashboardThumbnailDisplay } from '../DashboardThumbnailDisplay/DashboardThumbnailDisplay';
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

interface BaseDashboardThumbnailProps {
  addThumbnail: (thumbnail: Thumbnail) => void;
  video: Video;
  thumbnail: Nullable<Thumbnail>;
}

const BaseDashboardThumbnail = ({
  addThumbnail,
  video,
  thumbnail,
}: BaseDashboardThumbnailProps) => {
  const [disableUploadBtn, setDisableUploadBtn] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [error, setError] = useState(null);
  const [pollInterval, setPollInterval] = useState(-1);

  useEffect(() => {
    if (
      thumbnail &&
      thumbnail.upload_state === uploadState.PROCESSING &&
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
        `${API_ENDPOINT}/thumbnail/${thumbnail!.id}/`,
        {
          headers: {
            Authorization: `Bearer ${appData.jwt}`,
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
        to={UPLOAD_FORM_ROUTE(modelName.THUMBNAIL, thumbnail!.id)}
      />
    );
  }

  const thumbnailState = thumbnail ? thumbnail.upload_state : uploadState.READY;

  switch (thumbnailState) {
    case uploadState.UPLOADING:
      return (
        <Box>
          <DashboardObjectProgress objectId={thumbnail!.id} />
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
  }
};

interface DashboardThumbnailProps {
  video: Video;
}

const mapStateToProps = (
  state: RootState,
  { video }: DashboardThumbnailProps,
) => ({
  thumbnail: getThumbnail(state),
  video,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  addThumbnail: (thumbnail: Thumbnail) =>
    dispatch(addResource(modelName.THUMBNAIL, thumbnail)),
});

export const DashboardThumbnail = connect(
  mapStateToProps,
  mapDispatchToProps,
)(BaseDashboardThumbnail);

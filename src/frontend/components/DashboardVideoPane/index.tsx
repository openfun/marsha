import { Box } from 'grommet';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Redirect } from 'react-router';
import styled from 'styled-components';

import { appData } from '../../data/appData';
import { useVideo } from '../../data/stores/useVideo';
import { API_ENDPOINT } from '../../settings';
import { modelName } from '../../types/models';
import { uploadState, LiveModeType, Video } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { DashboardInternalHeading } from '../Dashboard/DashboardInternalHeading';
import { DashboardPaneButtons } from '../DashboardPaneButtons';
import { DashboardThumbnail } from '../DashboardThumbnail';
import { DashboardVideoHarvested } from '../DashboardVideoHarvested';
import { DashboardVideoLive } from '../DashboardVideoLive';
import { DashboardVideoPaneDownloadOption } from '../DashboardVideoPaneDownloadOption';
import { DashboardVideoPaneTranscriptOption } from '../DashboardVideoPaneTranscriptOption';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { ObjectStatusPicker } from '../ObjectStatusPicker';
import { UploadableObjectProgress } from '../UploadableObjectProgress';
import { UploadManagerStatus, useUploadManager } from '../UploadManager';

const { DELETED, ERROR, HARVESTED, HARVESTING, PENDING, PROCESSING, READY } =
  uploadState;

const messages = defineMessages({
  [DELETED]: {
    defaultMessage: 'This video is definitely deleted.',
    description: 'Dashboard helptext for when the video is in DELETED state',
    id: 'components.DashboardVideoPane.helpTextDeleted',
  },
  [ERROR]: {
    defaultMessage:
      'There was an error with your video. Retry or upload another one.',
    description:
      'Dashboard helptext for when the video failed to upload or get processed.',
    id: 'components.DashboardVideoPane.helptextError',
  },
  [HARVESTED]: {
    defaultMessage:
      'The video has been converted in VOD. You must explicitly publish the video by clicking the button below.',
    description: 'Dashboard helptext to ask user to finish VOD conversion',
    id: 'components.DashboardVideoPane.helptextHarvested',
  },
  [HARVESTING]: {
    defaultMessage:
      'Your video is currently converting from a live video to a VOD. This may take up to an hour. You can close the window and come back later.',
    description:
      'Dashboard helptext to warn users not to wait for video processing in front of this page.',
    id: 'components.DashboardVideoPane.helptextHarvesting',
  },
  [PENDING]: {
    defaultMessage: 'There is currently no video to display.',
    description:
      'Dashboard helptext for the case when there is no existing video nor anything in progress.',
    id: 'components.DashboardVideoPane.helptextPending',
  },
  [PROCESSING]: {
    defaultMessage:
      'Your video is currently processing. This may take up to an hour. You can close the window and come back later.',
    description:
      'Dashboard helptext to warn users not to wait for video processing in front of this page.',
    id: 'components.DashboardVideoPane.helptextProcessing',
  },
  [READY]: {
    defaultMessage: 'Your video is ready to play.',
    description: 'Dashboard helptext for ready-to-play videos.',
    id: 'components.DashboardVideoPane.helptextReady',
  },
  title: {
    defaultMessage: 'Video status',
    description:
      'Subtitle for the video part of the dashboard (right now the only part until we add timed text tracks).',
    id: 'components.DashboardVideoPane.title',
  },
  uploadingVideo: {
    defaultMessage:
      'Upload in progress... Please do not close or reload this page.',
    description:
      'Dashboard helptext to warn user not to navigate away during video upload.',
    id: 'components.DashboardVideoPane.helptextUploading',
  },
});

const DashboardVideoPaneInnerContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 1rem;
`;

const DashboardVideoPaneInternalHeading = styled(DashboardInternalHeading)`
  padding: 0 1rem 0 0;
`;

const CommonStatusLine = ({ video }: { video: Video }) => (
  <Box align={'center'} direction={'row'}>
    <DashboardVideoPaneInternalHeading>
      <FormattedMessage {...messages.title} />
    </DashboardVideoPaneInternalHeading>
    <ObjectStatusPicker object={video} />
  </Box>
);

/** Props shape for the DashboardVideoPane component. */
interface DashboardVideoPaneProps {
  video: Video;
}

export const DashboardVideoPane = ({ video }: DashboardVideoPaneProps) => {
  const intl = useIntl();
  const [error, setError] = useState(false);
  const { uploadManagerState } = useUploadManager();
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));

  const pollForVideo = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/videos/${video.id}/`, {
        headers: {
          Authorization: `Bearer ${appData.jwt}`,
        },
      });

      const incomingVideo: Video = await response.json();
      // If the video is PENDING on the backend and PROCESSING on our end, we're probably experiencing a race
      // condition where the backend is not yet aware of the end of the upload.
      if (
        incomingVideo.upload_state === PENDING &&
        video.upload_state === PROCESSING
      ) {
        // Disregard the server-provided video.
        return;
      }
      // When the video is ready, we need to update the App state so VideoForm has access to the URLs when it loads
      else if (incomingVideo.upload_state === READY) {
        updateVideo(incomingVideo);
      }
    } catch (error) {
      report(error);
      setError(true);
    }
  };

  useEffect(() => {
    if (
      video.upload_state === PROCESSING ||
      (video.upload_state === PENDING &&
        (uploadManagerState[video.id]?.status ===
          UploadManagerStatus.UPLOADING ||
          uploadManagerState[video.id]?.status === UploadManagerStatus.SUCCESS))
    ) {
      const interval = window.setInterval(
        () => pollForVideo(),
        1000 * appData.uploadPollInterval,
      );

      return () => {
        // As a matter of hygiene, stop the polling as we unmount
        window.clearInterval(interval);
      };
    }
  }, []);

  if (error) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
  }

  if (!video.is_ready_to_show && video.upload_state === ERROR) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('upload')} />;
  }

  switch (video.upload_state) {
    case PENDING:
      if (video.live_state !== null) {
        return (
          <DashboardVideoPaneInnerContainer>
            <Box
              direction={
                video.live_type === LiveModeType.RAW ? 'row' : 'column'
              }
            >
              <Box basis={'1/2'} margin={'small'}>
                <CommonStatusLine video={video} />
              </Box>
              <Box basis={'1/2'} margin={'small'}>
                <DashboardVideoLive video={video} />
              </Box>
            </Box>
          </DashboardVideoPaneInnerContainer>
        );
      } else if (
        uploadManagerState[video.id]?.status === UploadManagerStatus.UPLOADING
      ) {
        return (
          <DashboardVideoPaneInnerContainer>
            <CommonStatusLine video={video} />
            <Box margin={{ vertical: 'small' }}>
              <UploadableObjectProgress objectId={video.id} />
            </Box>
            {intl.formatMessage(messages.uploadingVideo)}
          </DashboardVideoPaneInnerContainer>
        );
      } else if (
        uploadManagerState[video.id]?.status === UploadManagerStatus.SUCCESS
      ) {
        return (
          <DashboardVideoPaneInnerContainer>
            <CommonStatusLine video={video} />
            {intl.formatMessage(messages[PROCESSING])}
          </DashboardVideoPaneInnerContainer>
        );
      } else {
        return (
          <DashboardVideoPaneInnerContainer>
            <CommonStatusLine video={video} />
            {intl.formatMessage(messages[PENDING])}
            <DashboardPaneButtons
              object={video}
              objectType={modelName.VIDEOS}
            />
          </DashboardVideoPaneInnerContainer>
        );
      }

    case PROCESSING:
    case ERROR:
    case DELETED:
    case HARVESTING:
      return (
        <DashboardVideoPaneInnerContainer>
          <CommonStatusLine video={video} />
          {intl.formatMessage(messages[video.upload_state])}
        </DashboardVideoPaneInnerContainer>
      );

    case READY:
      return (
        <DashboardVideoPaneInnerContainer>
          <Box direction={'row'}>
            <Box basis={'1/2'} margin={'small'}>
              <CommonStatusLine video={video} />
              {intl.formatMessage(messages[READY])}
              <DashboardVideoPaneDownloadOption video={video} />
              <DashboardVideoPaneTranscriptOption video={video} />
            </Box>
            <Box basis={'1/2'} margin={'small'}>
              <DashboardThumbnail video={video} />
            </Box>
          </Box>
          <DashboardPaneButtons object={video} objectType={modelName.VIDEOS} />
        </DashboardVideoPaneInnerContainer>
      );

    case HARVESTED:
      return (
        <DashboardVideoPaneInnerContainer>
          <Box direction={'column'}>
            <Box basis={'1/2'} margin={'small'}>
              <CommonStatusLine video={video} />
              {intl.formatMessage(messages[video.upload_state])}
            </Box>
            <Box basis={'1/2'} margin={'small'}>
              <DashboardVideoHarvested video={video} />
            </Box>
          </Box>
        </DashboardVideoPaneInnerContainer>
      );
  }
};

import { Box } from 'grommet';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router';
import styled from 'styled-components';

import { appData } from '../../data/appData';
import { useVideo } from '../../data/stores/useVideo';
import { API_ENDPOINT } from '../../settings';
import { modelName } from '../../types/models';
import { uploadState, Video } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { DashboardInternalHeading } from '../Dashboard/DashboardInternalHeading';
import { DashboardObjectProgress } from '../DashboardObjectProgress';
import { DashboardPaneButtons } from '../DashboardPaneButtons';
import { DashboardPaneHelptext } from '../DashboardPaneHelptext';
import { DashboardThumbnail } from '../DashboardThumbnail';
import { DashboardVideoPaneDownloadOption } from '../DashboardVideoPaneDownloadOption';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UploadStatusPicker } from '../UploadStatusPicker';
import { VIDEO_PLAYER_ROUTE } from '../VideoPlayer/route';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

const messages = defineMessages({
  title: {
    defaultMessage: 'Video status',
    description:
      'Subtitle for the video part of the dashboard (right now the only part until we add timed text tracks).',
    id: 'components.DashboardVideoPane.title',
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

/** Props shape for the DashboardVideoPane component. */
interface DashboardVideoPaneProps {
  video: Video;
}

export const DashboardVideoPane = ({ video }: DashboardVideoPaneProps) => {
  const [error, setError] = useState(false);
  const [pollInterval, setPollInterval] = useState();
  const { updateVideo } = useVideo(state => ({
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
    if ([PENDING, UPLOADING, PROCESSING].includes(video.upload_state)) {
      setPollInterval(window.setInterval(() => pollForVideo(), 1000 * 60));

      return () => {
        // As a matter of hygiene, stop the polling as we unmount
        window.clearInterval(pollInterval);
      };
    }
  }, []);

  if (error) {
    return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
  }

  if (!video.is_ready_to_play && video.upload_state === ERROR) {
    return <Redirect push to={ERROR_COMPONENT_ROUTE('upload')} />;
  }

  const commonStatusLine = (
    <Box align={'center'} direction={'row'}>
      <DashboardVideoPaneInternalHeading>
        <FormattedMessage {...messages.title} />
      </DashboardVideoPaneInternalHeading>
      <UploadStatusPicker state={video.upload_state} />
    </Box>
  );

  switch (video.upload_state) {
    case PENDING:
      return (
        <DashboardVideoPaneInnerContainer>
          {commonStatusLine}
          <DashboardPaneHelptext
            objectType={modelName.VIDEOS}
            state={video.upload_state}
          />
          <DashboardPaneButtons
            object={video}
            objectType={modelName.VIDEOS}
            routePlayer={VIDEO_PLAYER_ROUTE()}
          />
        </DashboardVideoPaneInnerContainer>
      );

    case UPLOADING:
      return (
        <DashboardVideoPaneInnerContainer>
          {commonStatusLine}
          <DashboardObjectProgress objectId={video.id} />
          <DashboardPaneHelptext
            objectType={modelName.VIDEOS}
            state={video.upload_state}
          />
        </DashboardVideoPaneInnerContainer>
      );

    case PROCESSING:
    case ERROR:
      return (
        <DashboardVideoPaneInnerContainer>
          {commonStatusLine}
          <DashboardPaneHelptext
            objectType={modelName.VIDEOS}
            state={video.upload_state}
          />
        </DashboardVideoPaneInnerContainer>
      );

    case READY:
      return (
        <DashboardVideoPaneInnerContainer>
          <Box direction={'row'}>
            <Box basis={'1/2'} margin={'small'}>
              {commonStatusLine}
              <DashboardPaneHelptext
                objectType={modelName.VIDEOS}
                state={video.upload_state}
              />
              <DashboardVideoPaneDownloadOption video={video} />
            </Box>
            <Box basis={'1/2'} margin={'small'}>
              <DashboardThumbnail video={video} />
            </Box>
          </Box>
          <DashboardPaneButtons
            object={video}
            objectType={modelName.VIDEOS}
            routePlayer={VIDEO_PLAYER_ROUTE()}
          />
        </DashboardVideoPaneInnerContainer>
      );
  }
};

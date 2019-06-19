import { Box } from 'grommet';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import { Dispatch } from 'redux';
import styled from 'styled-components';

import { addResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { API_ENDPOINT } from '../../settings';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
import { uploadState, Video } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { DashboardInternalHeading } from '../Dashboard/DashboardInternalHeading';
import { DashboardThumbnail } from '../DashboardThumbnail';
import { DashboardVideoPaneButtons } from '../DashboardVideoPaneButtons/DashboardVideoPaneButtons';
import { DashboardVideoPaneDownloadOptionConnected } from '../DashboardVideoPaneDownloadOptionConnected/DashboardVideoPaneDownloadOptionConnected';
import { DashboardVideoPaneHelptext } from '../DashboardVideoPaneHelptext/DashboardVideoPaneHelptext';
import { DashboardVideoPaneProgressConnected } from '../DashboardVideoPaneProgressConnected/DashboardVideoPaneProgressConnected';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UploadStatusPicker } from '../UploadStatusPicker/UploadStatusPicker';

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
interface BaseDashboardVideoPaneProps {
  jwt: string;
  updateVideo: (video: Video) => void;
  video: Video;
}

const BaseDashboardVideoPane = ({
  jwt,
  updateVideo,
  video,
}: BaseDashboardVideoPaneProps) => {
  const [error, setError] = useState(false);
  const [pollInterval, setPollInterval] = useState();

  const pollForVideo = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/videos/${video.id}/`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
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
          <DashboardVideoPaneHelptext state={video.upload_state} />
          <DashboardVideoPaneButtons video={video} />
        </DashboardVideoPaneInnerContainer>
      );

    case UPLOADING:
      return (
        <DashboardVideoPaneInnerContainer>
          {commonStatusLine}
          <DashboardVideoPaneProgressConnected videoId={video.id} />
          <DashboardVideoPaneHelptext state={video.upload_state} />
        </DashboardVideoPaneInnerContainer>
      );

    case PROCESSING:
    case ERROR:
      return (
        <DashboardVideoPaneInnerContainer>
          {commonStatusLine}
          <DashboardVideoPaneHelptext state={video.upload_state} />
        </DashboardVideoPaneInnerContainer>
      );

    case READY:
      return (
        <DashboardVideoPaneInnerContainer>
          <Box direction={'row'}>
            <Box basis={'1/2'} margin={'small'}>
              {commonStatusLine}
              <DashboardVideoPaneHelptext state={video.upload_state} />
              <DashboardVideoPaneDownloadOptionConnected video={video} />
            </Box>
            <Box basis={'1/2'} margin={'small'}>
              <DashboardThumbnail video={video} />
            </Box>
          </Box>
          <DashboardVideoPaneButtons video={video} />
        </DashboardVideoPaneInnerContainer>
      );
  }
};

const mapStateToProps = (state: RootState<appStateSuccess>) => ({
  jwt: state.context.jwt,
});

/** Create a function that updates a single video in the store. */
const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateVideo: (video: Video) => dispatch(addResource(modelName.VIDEOS, video)),
});

/** Component. Displays the "video" part of the Dashboard, including the state of the video in
 * marsha's pipeline. Provides links to the player and to the form to replace the video with another one.
 * @param video The video object from AppData. We need it to populate the component before polling starts.
 */
export const DashboardVideoPane = connect(
  mapStateToProps,
  mapDispatchToProps,
)(BaseDashboardVideoPane);

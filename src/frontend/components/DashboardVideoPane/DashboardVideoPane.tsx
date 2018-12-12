import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router';
import styled from 'styled-components';

import { API_ENDPOINT } from '../../settings';
import { uploadState, Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { DashboardInternalHeading } from '../Dashboard/DashboardInternalHeading';
import { DashboardVideoPaneButtons } from '../DashboardVideoPaneButtons/DashboardVideoPaneButtons';
import { DashboardVideoPaneHelptext } from '../DashboardVideoPaneHelptext/DashboardVideoPaneHelptext';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UploadStatusPicker } from '../UploadStatusPicker/UploadStatusPicker';

const messages = defineMessages({
  title: {
    defaultMessage: 'Video status',
    description:
      'Subtitle for the video part of the dashboard (right now the only part until we add timed text tracks).',
    id: 'components.Dashboard.title',
  },
});

const DashboardVideoPaneInnerContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 1rem;
`;

const DashboardVideoPaneStatusLine = styled.div`
  display: flex;
  align-items: center;
`;

const DashboardVideoPaneInternalHeading = styled(DashboardInternalHeading)`
  padding: 0 1rem 0 0;
`;

/** Props shape for the DashboardVideoPane component. */
export interface DashboardVideoPaneProps {
  jwt: Nullable<string>;
  updateVideo: (video: Video) => void;
  video: Video;
}

interface DashboardVideoPaneState {
  error?: boolean;
  pollInterval?: number;
}

/** Component. Displays the "video" part of the Dashboard, including the state of the video in
 * marsha's pipeline. Provides links to the player and to the form to replace the video with another one.
 * @param jwt The token that will be used to fetch the video record from the server to update it.
 * @param updateVideo Action creator that takes a video to update it in the store.
 * @param video The video object from AppData. We need it to populate the component before polling starts.
 */
export class DashboardVideoPane extends React.Component<
  DashboardVideoPaneProps,
  DashboardVideoPaneState
> {
  state: DashboardVideoPaneState = {};

  componentDidMount() {
    this.setState({
      pollInterval: window.setInterval(() => this.pollForVideo(), 1000 * 60),
    });
  }

  componentWillUnmount() {
    // As a matter of hygiene, stop the polling as we unmount
    if (this.state.pollInterval) {
      window.clearInterval(this.state.pollInterval);
    }
  }

  async pollForVideo() {
    const { jwt, updateVideo, video } = this.props; // NB: Video from props
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
        incomingVideo.upload_state === uploadState.PENDING &&
        video.upload_state === uploadState.PROCESSING
      ) {
        // Disregard the server-provided video.
        return;
      }
      // When the video is ready, we need to update the App state so VideoForm has access to the URLs when it loads
      else if (incomingVideo.upload_state === uploadState.READY) {
        updateVideo(incomingVideo);
      }
    } catch (error) {
      this.setState({ error: true });
    }
  }

  render() {
    const { video } = this.props;

    if (this.state.error) {
      return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
    }

    if (!video.is_ready_to_play && video.upload_state === uploadState.ERROR) {
      return <Redirect push to={ERROR_COMPONENT_ROUTE('upload')} />;
    }

    return (
      <DashboardVideoPaneInnerContainer>
        <DashboardVideoPaneStatusLine>
          <DashboardVideoPaneInternalHeading>
            <FormattedMessage {...messages.title} />
          </DashboardVideoPaneInternalHeading>
          <UploadStatusPicker state={video.upload_state} />
        </DashboardVideoPaneStatusLine>
        <DashboardVideoPaneHelptext state={video.upload_state} />
        <DashboardVideoPaneButtons state={video.upload_state} />
      </DashboardVideoPaneInnerContainer>
    );
  }
}

import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router';
import styled from 'styled-components';

import { API_ENDPOINT } from '../../settings';
import { Video, videoState } from '../../types/Video';
import { Nullable } from '../../utils/types';
import { DashboardInternalHeading } from '../Dashboard/DashboardInternalHeading';
import { DashboardVideoPaneButtons } from '../DashboardVideoPaneButtons/DashboardVideoPaneButtons';
import { DashboardVideoPaneHelptext } from '../DashboardVideoPaneHelptext/DashboardVideoPaneHelptext';
import { ROUTE as ERROR_ROUTE } from '../ErrorComponent/ErrorComponent';
import { UploadStatusList } from '../UploadStatusList/UploadStatusList';

const messages = defineMessages({
  title: {
    defaultMessage: 'Video preparation',
    description:
      'Subtitle for the video part of the dashboard (right now the only part until we add timed text tracks).',
    id: 'components.Dashboard.title',
  },
});

const DashboardInnerContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
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

      const incomingVideo = await response.json();
      // If the video is PENDING on the backend and PROCESSING on our end, we're probably experiencing a race
      // condition where the backend is not yet aware of the end of the upload.
      if (
        incomingVideo.state === videoState.PENDING &&
        video.state === videoState.PROCESSING
      ) {
        // Disregard the server-provided video.
        return;
      }
      // When the video is ready, we need to update the App state so VideoForm has access to the URLs when it loads
      else if (incomingVideo.state === videoState.READY) {
        updateVideo(incomingVideo);
      }
    } catch (error) {
      this.setState({ error: true });
    }
  }

  render() {
    const { video } = this.props;

    if (this.state.error) {
      return <Redirect push to={ERROR_ROUTE('notFound')} />;
    }

    if (video.state === videoState.ERROR) {
      return <Redirect push to={ERROR_ROUTE('upload')} />;
    }

    return (
      <DashboardInnerContainer>
        <DashboardInternalHeading>
          <FormattedMessage {...messages.title} />
        </DashboardInternalHeading>
        <UploadStatusList state={video.state} />
        <DashboardVideoPaneHelptext state={video.state} />
        <DashboardVideoPaneButtons state={video.state} />
      </DashboardInnerContainer>
    );
  }
}

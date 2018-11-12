import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router';
import styled from 'styled-components';

import { API_ENDPOINT } from '../../settings';
import { Video, videoState } from '../../types/Video';
import { Maybe } from '../../utils/types';
import { ROUTE as ERROR_ROUTE } from '../ErrorComponent/ErrorComponent';
import { H6, IframeHeading } from '../Headings/Headings';
import { UploadStatusList } from '../UploadStatusList/UploadStatusList';
import { DashboardButtons } from './DashboardButtons';
import { DashboardHelptext } from './DashboardHelptext';

const { UPLOADING } = videoState;

const messages = defineMessages({
  subtitleForVideo: {
    defaultMessage: 'Video preparation',
    description:
      'Subtitle for the video part of the dashboard (right now the only part until we add subtitles).',
    id: 'components.Dashboard.subtitleForVideo',
  },
  title: {
    defaultMessage: 'Dashboard',
    description: `Title for the dashboard, where the user can see the status of the video/audio/subtitles upload
      & processing, and will be able to manage them.`,
    id: 'components.Dashboard.title',
  },
});

export const ROUTE = () => '/dashboard';

const IframeHeadingWithLayout = styled(IframeHeading)`
  flex-grow: 0;
  margin: 0;
  text-align: center;
`;

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100%;
`;

const DashboardInternalHeading = styled(H6)`
  margin: 0;
  padding: 0 1rem;
  font-weight: 400;
`;

const DashboardInnerContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`;

/** Props shape for the Dashboard component. */
export interface DashboardProps {
  isUploading?: boolean;
  jwt: string;
  updateVideo?: (video: Video) => void;
  video: Video;
}

interface DashboardState {
  error: Maybe<boolean>;
  pollInterval?: number;
  video: Maybe<Video>;
}

/** Component. Displays a Dashboard with the state of the video in marsha's pipeline and provides links to
 * the player and to the form to replace the video with another one.
 * Will also be used to manage related tracks such as subtitles when they are available.
 * @param isUploading Whether the relevant video file is currently being uploaded.
 * @param jwt The token that will be used to fetch the video record from the server to update it.
 * @param updateVideo Callback to update the video in App state.
 * @param video The video object from AppData. We need it to populate the component before polling starts.
 */
export class Dashboard extends React.Component<DashboardProps, DashboardState> {
  state: DashboardState = { error: undefined, video: undefined };

  componentWillMount() {
    // We only need to poll if the current state is PROCESSING
    // For other states, there will not be any updates coming from the backend
    if (this.props.video.state === videoState.PROCESSING) {
      this.setState({
        pollInterval: window.setInterval(() => this.pollForVideo(), 1000 * 60),
      });
    }
  }

  componentWillUnmount() {
    // As a matter of hygiene, stop the polling as we unmount
    if (this.state.pollInterval) {
      window.clearInterval(this.state.pollInterval);
    }
  }

  async pollForVideo() {
    const { jwt, video } = this.props; // NB: Video from props
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
        if (this.props.updateVideo) {
          this.props.updateVideo(incomingVideo);
        }
      }
      this.setState({ video: incomingVideo });
    } catch (error) {
      this.setState({ error: true });
    }
  }

  render() {
    const video = this.state.video || this.props.video;
    const state = this.props.isUploading ? UPLOADING : video.state;

    if (this.state.error) {
      return <Redirect push to={ERROR_ROUTE('notFound')} />;
    }

    return (
      <DashboardContainer>
        <IframeHeadingWithLayout>
          <FormattedMessage {...messages.title} />
        </IframeHeadingWithLayout>
        <DashboardInnerContainer>
          <DashboardInternalHeading>
            <FormattedMessage {...messages.subtitleForVideo} />
          </DashboardInternalHeading>
          <UploadStatusList state={state} />
          <DashboardHelptext state={state} />
          <DashboardButtons state={state} />
        </DashboardInnerContainer>
      </DashboardContainer>
    );
  }
}

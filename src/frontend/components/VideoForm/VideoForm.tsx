import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { API_ENDPOINT } from '../../settings';
import { AWSPolicy } from '../../types/AWSPolicy';
import { trackState, Video } from '../../types/tracks';
import { makeFormData } from '../../utils/makeFormData/makeFormData';
import { Maybe, Nullable } from '../../utils/types';
import { ROUTE as DASHBOARD_ROUTE } from '../Dashboard/Dashboard';
import { ROUTE as ERROR_ROUTE } from '../ErrorComponent/ErrorComponent';
import { IframeHeading } from '../Headings/Headings';
import { LayoutMainArea } from '../LayoutMainArea/LayoutMainArea';
import { VideoUploadField } from '../VideoUploadField/VideoUploadField';

const messages = defineMessages({
  button: {
    defaultMessage: 'Send',
    description:
      'CTA for the form button for a video & its title & description',
    id: 'components.VideoForm.button',
  },
  linkToDashboard: {
    defaultMessage: 'Back to dashboard',
    description: 'Text for the link to the dashboard in the video form.',
    id: 'components.VideoForm.linkToDashboard',
  },
  title: {
    defaultMessage: 'Create a new video',
    description: 'Title for the video upload form',
    id: 'components.VideoForm.title',
  },
});

export const ROUTE = () => '/form';

const VideoFormContainer = styled(LayoutMainArea)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const IframeHeadingWithLayout = styled(IframeHeading)`
  flex-grow: 0;
  margin: 0;
  text-align: center;
`;

const VideoUploadFieldContainer = styled.div`
  flex-grow: 1;
  display: flex;
`;

const VideoFormBack = styled.div`
  line-height: 2rem;
  padding: 0.5rem 1rem;
`;

interface VideoFormProps {
  jwt: Nullable<string>;
  updateVideo: (video: Video) => void;
  video: Video;
}

interface VideoFormState {
  file: Maybe<File>;
  policy: AWSPolicy;
  status: Maybe<'policy_error' | 'uploading' | 'success'>;
}

export class VideoForm extends React.Component<VideoFormProps, VideoFormState> {
  async componentDidMount() {
    const { jwt, video } = this.props;

    try {
      const response = await fetch(
        `${API_ENDPOINT}/videos/${video.id}/upload-policy/`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      );
      const policy = await response.json();
      this.setState({ policy });
    } catch (error) {
      this.setState({ status: 'policy_error' });
    }
  }

  onVideoFieldContentUpdated(file: Maybe<File>) {
    this.setState({ file });
    this.upload();
  }

  async upload() {
    const { file, policy } = this.state;
    const { updateVideo, video } = this.props;

    this.setState({ status: 'uploading' });

    // Use FormData to meet the requirement of a multi-part POST request for s3
    // NB: order of keys is important here, which is why we do not iterate over an object
    const formData = makeFormData(
      ['key', policy.key],
      ['acl', policy.acl],
      ['Content-Type', file!.type],
      ['X-Amz-Credential', policy.x_amz_credential],
      ['X-Amz-Algorithm', policy.x_amz_algorithm],
      ['X-Amz-Date', policy.x_amz_date],
      ['Policy', policy.policy],
      ['X-Amz-Signature', policy.x_amz_signature],
      // Add the file after all of the text fields
      ['file', file!],
    );

    try {
      // Update the state to reflect the in-progress upload (for the dashboard)
      // Useful for the Dashboard loader and help text.
      updateVideo({
        ...video,
        state: trackState.UPLOADING,
      });

      const response = await fetch(
        `https://${policy.s3_endpoint}/${policy.bucket}`,
        {
          body: formData,
          method: 'POST',
        },
      );

      if (response.ok) {
        updateVideo({
          ...video,
          state: trackState.PROCESSING,
        });
      } else {
        throw new Error('Failed to upload video.');
      }
    } catch (error) {
      updateVideo({
        ...video,
        state: trackState.ERROR,
      });
    }
  }

  render() {
    const { status } = this.state || { status: '' };

    switch (status) {
      case 'success':
      case 'uploading':
        return <Redirect push to={DASHBOARD_ROUTE()} />;

      case 'policy_error':
        return <Redirect push to={ERROR_ROUTE('policy')} />;

      default:
        return (
          <div>
            <VideoFormContainer>
              <IframeHeadingWithLayout>
                <FormattedMessage {...messages.title} />
              </IframeHeadingWithLayout>
              <VideoUploadFieldContainer>
                <VideoUploadField
                  onContentUpdated={this.onVideoFieldContentUpdated.bind(this)}
                />
              </VideoUploadFieldContainer>
            </VideoFormContainer>
            <VideoFormBack>
              <Link to={DASHBOARD_ROUTE()}>
                <FormattedMessage {...messages.linkToDashboard} />
              </Link>
            </VideoFormBack>
          </div>
        );
    }
  }
}

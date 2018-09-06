import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { API_ENDPOINT } from '../../settings';
import { AWSPolicy } from '../../types/AWSPolicy';
import { Video } from '../../types/Video';
import { makeFormData } from '../../utils/makeFormData/makeFormData';
import { Maybe } from '../../utils/types';
import { ROUTE as ERROR_ROUTE } from '../ErrorComponent/ErrorComponent';
import { ROUTE as PLAYER_ROUTE } from '../VideoJsPlayer/VideoJsPlayer';
import { VideoUploadField } from '../VideoUploadField/VideoUploadField';

export interface VideoFormProps {
  jwt: string;
  video: Video;
}

interface VideoFormState {
  file: Maybe<File>;
  policy: AWSPolicy;
  status: Maybe<'policy_error' | 'upload_error' | 'success'>;
}

const messages = defineMessages({
  button: {
    defaultMessage: 'Send',
    description:
      'CTA for the form button for a video & its title & description',
    id: 'components.VideoForm.button',
  },
  title: {
    defaultMessage: 'Create a new video',
    description: 'Title for the video upload form',
    id: 'components.VideoForm.title',
  },
});

export const ROUTE = () => '/form';

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
  }

  async upload() {
    const { jwt } = this.props;
    const { file, policy } = this.state;

    // Use FormData to meet the requirement of a multi-part POST request for s3
    // NB: order of keys is important here, which is why we do not iterate over an object
    const formData = makeFormData(
      ['key', policy.key],
      ['acl', policy.acl],
      ['Content-Type', file!.type],
      ['X-Amz-Credential', policy.x_amz_credential],
      ['X-Amz-Algorithm', policy.x_amz_algorithm],
      ['X-Amz-Meta-Jwt', jwt],
      ['X-Amz-Date', policy.x_amz_date],
      ['Policy', policy.policy],
      ['X-Amz-Signature', policy.x_amz_signature],
      // Add the file after all of the text fields
      ['file', file!],
    );

    try {
      await fetch(`https://${policy.s3_endpoint}/${policy.bucket}`, {
        body: formData,
        method: 'POST',
      });
      this.setState({ status: 'success' });
    } catch (error) {
      this.setState({ status: 'upload_error' });
    }
  }

  render() {
    const { file, status } = this.state || { file: undefined, status: '' };

    switch (status) {
      case 'success':
        return <Redirect push to={PLAYER_ROUTE()} />;

      case 'policy_error':
        return <Redirect push to={ERROR_ROUTE('policy')} />;

      case 'upload_error':
        return <Redirect push to={ERROR_ROUTE('upload')} />;

      default:
        return (
          <div className="video-form">
            <h2>
              <FormattedMessage {...messages.title} />
            </h2>
            <input type="text" name="title" />
            <textarea name="description" />
            <VideoUploadField
              onContentUpdated={this.onVideoFieldContentUpdated.bind(this)}
            />
            <button disabled={!file} onClick={this.upload.bind(this)}>
              <FormattedMessage {...messages.button} />
            </button>
          </div>
        );
    }
  }
}

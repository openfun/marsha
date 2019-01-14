import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { initiateUpload } from '../../data/sideEffects/initiateUpload/initiateUpload';
import { AWSPolicy } from '../../types/AWSPolicy';
import { modelName } from '../../types/models';
import { UploadableObject, uploadState } from '../../types/tracks';
import { makeFormData } from '../../utils/makeFormData/makeFormData';
import { Maybe, Nullable } from '../../utils/types';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { IframeHeading } from '../Headings/Headings';
import { LayoutMainArea } from '../LayoutMainArea/LayoutMainArea';
import { UploadField } from '../UploadField/UploadField';

const messages = defineMessages({
  linkToDashboard: {
    defaultMessage: 'Back to dashboard',
    description: 'Text for the link to the dashboard in the upload form.',
    id: 'components.UploadForm.linkToDashboard',
  },
});

const titleMessages = defineMessages({
  [modelName.TIMEDTEXTTRACKS]: {
    defaultMessage: 'Upload a new subtitles/captions/transcript file',
    description: 'Title for the timed text file upload form',
    id: 'components.UploadForm.title-timedtexttracks',
  },
  [modelName.VIDEOS]: {
    defaultMessage: 'Create a new video',
    description: 'Title for the video upload form',
    id: 'components.UploadForm.title-videos',
  },
});

const UploadFormContainer = styled(LayoutMainArea)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const IframeHeadingWithLayout = styled(IframeHeading)`
  flex-grow: 0;
  margin: 0;
  text-align: center;
`;

const UploadFieldContainer = styled.div`
  flex-grow: 1;
  display: flex;
`;

const UploadFormBack = styled.div`
  line-height: 2rem;
  padding: 0.5rem 1rem;
`;

/** Props shape for the UploadForm component. */
interface UploadFormProps {
  jwt: Nullable<string>;
  object: Maybe<UploadableObject>;
  objectType: modelName;
  updateObject: (object: UploadableObject) => void;
}

/** State shape for the UploadForm component. */
interface UploadFormState {
  status: Maybe<'not_found_error' | 'policy_error' | 'uploading' | 'success'>;
}

/**
 * Component. Displays a form with a dropzone and a file upload button to add a file to the
 * object passed in the props.
 * @param jwt The token that will be used to fetch the object record from the server to update it.
 * @param object The object for which we want to add a file.
 * @param objectType The model name for the object.
 * @param updateObject Action creator that takes an object to update it in the store.
 */
export class UploadForm extends React.Component<
  UploadFormProps,
  UploadFormState
> {
  async upload(file: Maybe<File>) {
    const { jwt, object, objectType, updateObject } = this.props;
    // Do not trigger an upload if we did not receive a file object.
    if (!file) {
      return;
    }

    if (!object) {
      return this.setState({ status: 'not_found_error' });
    }

    let policy: AWSPolicy;
    try {
      policy = await initiateUpload(jwt, objectType, object.id);
    } catch (error) {
      return this.setState({ status: 'policy_error' });
    }

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
      updateObject({
        ...object,
        upload_state: uploadState.UPLOADING,
      });

      const response = await fetch(
        `https://${policy.s3_endpoint}/${policy.bucket}`,
        {
          body: formData,
          method: 'POST',
        },
      );

      if (response.ok) {
        updateObject({
          ...object,
          upload_state: uploadState.PROCESSING,
        });
      } else {
        throw new Error(`Failed to upload ${objectType}.`);
      }
    } catch (error) {
      updateObject({
        ...object,
        upload_state: uploadState.ERROR,
      });
    }
  }

  render() {
    const { objectType } = this.props;
    const { status } = this.state || { status: '' };

    switch (status) {
      case 'success':
      case 'uploading':
        return <Redirect push to={DASHBOARD_ROUTE()} />;

      case 'not_found_error':
        return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;

      case 'policy_error':
        return <Redirect push to={ERROR_COMPONENT_ROUTE('policy')} />;

      default:
        return (
          <div>
            <UploadFormContainer>
              <IframeHeadingWithLayout>
                <FormattedMessage {...titleMessages[objectType]} />
              </IframeHeadingWithLayout>
              <UploadFieldContainer>
                <UploadField onContentUpdated={this.upload.bind(this)} />
              </UploadFieldContainer>
            </UploadFormContainer>
            <UploadFormBack>
              <Link to={DASHBOARD_ROUTE()}>
                <FormattedMessage {...messages.linkToDashboard} />
              </Link>
            </UploadFormBack>
          </div>
        );
    }
  }
}

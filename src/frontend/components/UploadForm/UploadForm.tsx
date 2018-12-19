import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { API_ENDPOINT } from '../../settings';
import { AWSPolicy } from '../../types/AWSPolicy';
import { modelName } from '../../types/models';
import { trackState, UploadableObject } from '../../types/tracks';
import { makeFormData } from '../../utils/makeFormData/makeFormData';
import { Maybe, Nullable } from '../../utils/types';
import { ROUTE as DASHBOARD_ROUTE } from '../Dashboard/Dashboard';
import { ROUTE as ERROR_ROUTE } from '../ErrorComponent/ErrorComponent';
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
  [modelName.VIDEOS]: {
    defaultMessage: 'Create a new video',
    description: 'Title for the video upload form',
    id: 'components.UploadForm.title',
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

/**
 * Route for the `<UploadForm />` component.
 * @param objectType The model name for the object for which we're uploading a file.
 * @param objectId The ID of said object.
 */
export const ROUTE = (
  objectType?: modelName,
  objectId?: UploadableObject['id'],
) => {
  if (objectType) {
    return `/form/${objectType}/${objectId}`;
  } else {
    return `/form/:objectType(${Object.values(modelName).join('|')})/:objectId`;
  }
};

/** Props shape for the UploadForm component. */
interface UploadFormProps {
  jwt: Nullable<string>;
  object: Maybe<UploadableObject>;
  objectType: modelName;
  updateObject: (object: UploadableObject) => void;
}

/** State shape for the UploadForm component. */
interface UploadFormState {
  file: Maybe<File>;
  policy: AWSPolicy;
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
  async componentDidMount() {
    const { jwt, object, objectType } = this.props;

    if (!object) {
      return this.setState({ status: 'not_found_error' });
    }

    try {
      const response = await fetch(
        `${API_ENDPOINT}/${objectType}/${object.id}/upload-policy/`,
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

  onUploadFieldContentUpdated(file: Maybe<File>) {
    this.setState({ file });
    this.upload();
  }

  async upload() {
    const { file, policy } = this.state;
    const { object, objectType, updateObject } = this.props;

    if (!object) {
      return this.setState({ status: 'not_found_error' });
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
        updateObject({
          ...object,
          state: trackState.PROCESSING,
        });
      } else {
        throw new Error(`Failed to upload ${objectType}.`);
      }
    } catch (error) {
      updateObject({
        ...object,
        state: trackState.ERROR,
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
        return <Redirect push to={ERROR_ROUTE('notFound')} />;

      case 'policy_error':
        return <Redirect push to={ERROR_ROUTE('policy')} />;

      default:
        return (
          <div>
            <UploadFormContainer>
              <IframeHeadingWithLayout>
                <FormattedMessage {...titleMessages[objectType]} />
              </IframeHeadingWithLayout>
              <UploadFieldContainer>
                <UploadField
                  onContentUpdated={this.onUploadFieldContentUpdated.bind(this)}
                />
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

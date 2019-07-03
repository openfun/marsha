import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { Dispatch } from 'redux';
import styled from 'styled-components';

import { addResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { upload } from '../../data/sideEffects/upload';
import { useObjectProgress } from '../../data/stores/useObjectProgress';
import { modelName } from '../../types/models';
import { TimedText, timedTextMode, UploadableObject } from '../../types/tracks';
import { Maybe } from '../../utils/types';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { IframeHeading } from '../Headings';
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
    id: 'components.UploadForm.title-videos',
  },
  [modelName.THUMBNAIL]: {
    defaultMessage: 'Upload a new thumbnail',
    description: 'Title for the thumbnail upload form',
    id: 'components.UploadForm.title-thumbnail',
  },
});

const timedtexttrackTitleMessages = defineMessages({
  [timedTextMode.CLOSED_CAPTIONING]: {
    defaultMessage: 'Upload a new closed captions file',
    description: 'Title for the timed text file upload form',
    id: 'components.UploadForm.title-timedtexttracks-cc',
  },
  [timedTextMode.SUBTITLE]: {
    defaultMessage: 'Upload a new subtitles file',
    description: 'Title for the timed text file upload form',
    id: 'components.UploadForm.title-timedtexttracks-st',
  },
  [timedTextMode.TRANSCRIPT]: {
    defaultMessage: 'Upload a new transcript file',
    description: 'Title for the timed text file upload form',
    id: 'components.UploadForm.title-timedtexttracks-ts',
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

/** Props shape for the BaseUploadForm component. */
interface BaseUploadFormProps {
  object: Maybe<UploadableObject>;
  objectType: modelName;
  updateObject: (object: UploadableObject) => void;
}

export type Status = Maybe<
  'not_found_error' | 'policy_error' | 'uploading' | 'success'
>;

const BaseUploadForm = ({
  object,
  objectType,
  updateObject,
}: BaseUploadFormProps) => {
  const [status, setStatus] = useState(undefined as Status);

  const setObjectProgress = useObjectProgress(state => state.setObjectProgress);

  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (status === 'uploading') {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  useEffect(() => {
    window.addEventListener('beforeunload', beforeUnload);

    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

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
              <FormattedMessage
                {...(objectType === modelName.TIMEDTEXTTRACKS
                  ? timedtexttrackTitleMessages[(object as TimedText).mode]
                  : titleMessages[objectType])}
              />
            </IframeHeadingWithLayout>
            <UploadFieldContainer>
              <UploadField
                onContentUpdated={upload(
                  updateObject,
                  setStatus,
                  (progress: number) =>
                    object && setObjectProgress(object.id, progress),
                  objectType,
                  object,
                )}
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
};

/** Props shape for the UploadForm connected component. */
interface UploadFormProps {
  objectId: UploadableObject['id'];
  objectType: modelName;
}

/**
 * Use the objectType & objectId from the props to get the actual object.
 * Also, just pass the jwt and objectType along.
 */
const mapStateToProps = (
  state: RootState,
  { objectId, objectType }: UploadFormProps,
) => ({
  object:
    state.resources[objectType]!.byId &&
    state.resources[objectType]!.byId[objectId],
  objectType,
});

/** Create a function that updates a single object record in the store. */
const mapDispatchToProps = (
  dispatch: Dispatch,
  { objectType }: UploadFormProps,
) => ({
  updateObject: (object: UploadableObject) =>
    dispatch(addResource(objectType, object)),
});

/**
 * Component. Displays the `<UploadForm />` to allow a file upload to a related object.
 * @param objectId The ID for the relevant object record for which we're uploading a file.
 * @param objectType The model name for the object for which we're uploading a file.
 */
export const UploadForm = connect(
  mapStateToProps,
  mapDispatchToProps,
)(BaseUploadForm);

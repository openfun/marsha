import { Maybe } from 'lib-common';
import { Loader } from 'lib-components';
import { modelName as markdownModelName } from 'lib-components/src/types/apps/markdown/models';
import { modelName as depositModelName } from 'lib-components/src/types/apps/deposit/models';
import { modelName as bbbModelName } from 'lib-components/src/types/apps/classroom/models';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { IframeHeading } from 'components/Headings';
import { LayoutMainArea } from 'components/LayoutMainArea';
import { UploadField } from 'components/UploadField';
import {
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { getResource } from 'data/stores/generics';
import { modelName, uploadableModelName } from 'lib-components';
import { TimedText, timedTextMode, UploadableObject } from 'lib-components';

import { useAsyncEffect } from 'utils/useAsyncEffect';
import { useAppConfig } from 'data/stores/useAppConfig';

const messages = defineMessages({
  linkToDashboard: {
    defaultMessage: 'Back to dashboard',
    description: 'Text for the link to the dashboard in the upload form.',
    id: 'components.UploadForm.linkToDashboard',
  },
  preparingUpload: {
    defaultMessage: 'Preparing for upload...',
    description:
      'Accessible message for the spinner while loading the uploadable object in the upload form.',
    id: 'components.UploadForm.preparingUpload',
  },
});

const titleMessages = defineMessages({
  [modelName.VIDEOS]: {
    defaultMessage: 'Create a new video',
    description: 'Title for the video upload form',
    id: 'components.UploadForm.title-videos',
  },
  [modelName.THUMBNAILS]: {
    defaultMessage: 'Upload a new thumbnail',
    description: 'Title for the thumbnail upload form',
    id: 'components.UploadForm.title-thumbnail',
  },
  [modelName.DOCUMENTS]: {
    defaultMessage: 'Upload a new document',
    description: 'Title for the document upload form',
    id: 'components.UploadForm.title-document',
  },
  [markdownModelName.MARKDOWN_IMAGES]: {
    defaultMessage: 'Upload a new Markdown image',
    description: 'Title for the Markdown image upload form',
    id: 'components.UploadForm.title-markdown-image',
  },
  [depositModelName.DepositedFiles]: {
    defaultMessage: 'Upload a new file',
    description: 'Title for the deposited file upload form',
    id: 'components.UploadForm.title-depositedfile',
  },
  [bbbModelName.CLASSROOM_DOCUMENTS]: {
    defaultMessage: 'Upload a new file',
    description: 'Title for the classroom document upload form',
    id: 'components.UploadForm.title-classroomdocument',
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

/** Props shape for the UploadForm component. */
export interface UploadFormProps {
  objectId: UploadableObject['id'];
  objectType: uploadableModelName;
}

export const UploadForm = ({ objectId, objectType }: UploadFormProps) => {
  const appData = useAppConfig();
  const { uploadManagerState, resetUpload } = useUploadManager();
  const objectStatus = uploadManagerState[objectId]?.status;

  const [object, setObject] = useState(undefined as Maybe<UploadableObject>);
  useAsyncEffect(async () => {
    setObject(await getResource(objectType, objectId));
  }, []);

  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (objectStatus === UploadManagerStatus.UPLOADING) {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  useEffect(() => {
    if (uploadManagerState[objectId]) resetUpload(objectId);
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

  if (object === undefined) {
    return (
      <Loader>
        <FormattedMessage {...messages.preparingUpload} />
      </Loader>
    );
  }

  switch (objectStatus) {
    case UploadManagerStatus.SUCCESS:
    case UploadManagerStatus.UPLOADING:
      return <Redirect push to={DASHBOARD_ROUTE(appData.modelName)} />;

    case UploadManagerStatus.ERR_POLICY:
      return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('policy')} />;

    case UploadManagerStatus.ERR_UPLOAD:
      return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('upload')} />;

    case UploadManagerStatus.INIT:
    default:
      return (
        <div>
          <UploadFormContainer>
            <IframeHeadingWithLayout>
              <FormattedMessage
                {...(objectType === modelName.TIMEDTEXTTRACKS
                  ? timedtexttrackTitleMessages[(object as TimedText).mode]
                  : objectType !== modelName.SHAREDLIVEMEDIAS &&
                    titleMessages[objectType])}
              />
            </IframeHeadingWithLayout>
            <UploadFieldContainer>
              <UploadField {...{ objectType, objectId }} />
            </UploadFieldContainer>
          </UploadFormContainer>
          <UploadFormBack>
            <Link to={DASHBOARD_ROUTE(appData.modelName)}>
              <FormattedMessage {...messages.linkToDashboard} />
            </Link>
          </UploadFormBack>
        </div>
      );
  }
};

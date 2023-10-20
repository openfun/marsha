import { Maybe, colorsTokens } from 'lib-common';
import { useEffect, useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';

import {
  FULL_SCREEN_ERROR_ROUTE,
  builderFullScreenErrorRoute,
} from '@lib-components/common/ErrorComponents/route';
import { Heading } from '@lib-components/common/Headings';
import { LayoutMainArea } from '@lib-components/common/LayoutMainArea';
import { UploadField } from '@lib-components/common/UploadField';
import {
  UploadManagerStatus,
  useUploadManager,
} from '@lib-components/common/UploadManager';
import { builderDashboardRoute } from '@lib-components/data/routes';
import { getStoreResource } from '@lib-components/data/stores/generics';
import { useAppConfig } from '@lib-components/data/stores/useAppConfig';
import { modelName, uploadableModelName } from '@lib-components/types/models';
import { TimedText, UploadableObject } from '@lib-components/types/tracks';

import { BoxLoader } from '../Loader/BoxLoader';

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
  videos: {
    defaultMessage: 'Create a new video',
    description: 'Title for the video upload form',
    id: 'components.UploadForm.title-videos',
  },
  thumbnails: {
    defaultMessage: 'Upload a new thumbnail',
    description: 'Title for the thumbnail upload form',
    id: 'components.UploadForm.title-thumbnail',
  },
  documents: {
    defaultMessage: 'Upload a new document',
    description: 'Title for the document upload form',
    id: 'components.UploadForm.title-document',
  },
  'markdown-images': {
    defaultMessage: 'Upload a new Markdown image',
    description: 'Title for the Markdown image upload form',
    id: 'components.UploadForm.title-markdown-image',
  },
  depositedfiles: {
    defaultMessage: 'Upload a new file',
    description: 'Title for the deposited file upload form',
    id: 'components.UploadForm.title-depositedfile',
  },
  classroomdocuments: {
    defaultMessage: 'Upload a new file',
    description: 'Title for the classroom document upload form',
    id: 'components.UploadForm.title-classroomdocument',
  },
});

const timedtexttrackTitleMessages = defineMessages({
  cc: {
    defaultMessage: 'Upload a new closed captions file',
    description: 'Title for the timed text file upload form',
    id: 'components.UploadForm.title-timedtexttracks-cc',
  },
  st: {
    defaultMessage: 'Upload a new subtitles file',
    description: 'Title for the timed text file upload form',
    id: 'components.UploadForm.title-timedtexttracks-st',
  },
  ts: {
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
  parentId?: Maybe<string>;
}

export const UploadForm = ({
  objectId,
  objectType,
  parentId,
}: UploadFormProps) => {
  const intl = useIntl();
  const appData = useAppConfig();
  const { uploadManagerState, resetUpload } = useUploadManager();
  const objectStatus = uploadManagerState[objectId]?.status;

  const [object, setObject] = useState(undefined as Maybe<UploadableObject>);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted && uploadManagerState[objectId]) {
      resetUpload(objectId);
    }
  }, [isMounted, objectId, resetUpload, uploadManagerState]);

  useEffect(() => {
    (async () => setObject(await getStoreResource(objectType, objectId)))();
  }, [objectId, objectType]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (objectStatus === UploadManagerStatus.UPLOADING) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [objectStatus]);

  if (object === undefined) {
    return (
      <BoxLoader aria-label={intl.formatMessage(messages.preparingUpload)} />
    );
  }

  switch (objectStatus) {
    case UploadManagerStatus.SUCCESS:
    case UploadManagerStatus.UPLOADING:
      return <Navigate to={builderDashboardRoute(appData.modelName)} />;

    case UploadManagerStatus.ERR_POLICY:
      return (
        <Navigate
          to={builderFullScreenErrorRoute(FULL_SCREEN_ERROR_ROUTE.codes.policy)}
        />
      );

    case UploadManagerStatus.ERR_SIZE:
      return (
        <Navigate
          to={builderFullScreenErrorRoute(
            FULL_SCREEN_ERROR_ROUTE.codes.fileTooLarge,
          )}
        />
      );

    case UploadManagerStatus.ERR_UPLOAD:
      return (
        <Navigate
          to={builderFullScreenErrorRoute(FULL_SCREEN_ERROR_ROUTE.codes.upload)}
        />
      );

    case UploadManagerStatus.INIT:
    default:
      return (
        <div>
          <UploadFormContainer>
            <Heading
              level={2}
              textAlign="center"
              color={colorsTokens['greyscale-800']}
            >
              <FormattedMessage
                {...(objectType === modelName.TIMEDTEXTTRACKS
                  ? timedtexttrackTitleMessages[(object as TimedText).mode]
                  : objectType !== modelName.SHAREDLIVEMEDIAS &&
                    titleMessages[objectType])}
              />
            </Heading>
            <UploadFieldContainer>
              <UploadField {...{ objectType, objectId, parentId }} />
            </UploadFieldContainer>
          </UploadFormContainer>
          <UploadFormBack>
            <Link to={builderDashboardRoute(appData.modelName)}>
              <FormattedMessage {...messages.linkToDashboard} />
            </Link>
          </UploadFormBack>
        </div>
      );
  }
};

import { colorsTokens } from 'lib-common';
import {
  Box,
  Document,
  ObjectStatusPicker,
  Text,
  UploadManagerStatus,
  UploadableObjectProgress,
  modelName,
  uploadState,
  useDocument,
  useUploadManager,
} from 'lib-components';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { pollForTrack } from 'data/sideEffects/pollForTrack';

import { DashboardDocumentPaneButtons } from './DashboardDocumentPaneButtons';
import { DashboardDocumentTitleForm } from './DashboardDocumentTitleForm';
import DocumentPlayer from './DocumentPlayer';

const { ERROR, PENDING, PROCESSING, READY } = uploadState;

const messages = defineMessages({
  filename: {
    defaultMessage: 'Filename',
    description: 'Document filename.',
    id: 'components.DashboardDocument.filename',
  },
  title: {
    defaultMessage: 'Document status',
    description: 'Document upload status.',
    id: 'components.DashboardDocument.title',
  },
  [PENDING]: {
    defaultMessage: 'There is currently no document to display.',
    description:
      'Dashboard helptext for the case when there is no existing document nor anything in progress.',
    id: 'components.DashboardDocument.helptextPending',
  },
  [READY]: {
    defaultMessage: 'Your document is ready to display.',
    description: 'Dashboard helptext for ready-to-display documents.',
    id: 'components.DashboardDocument.helptextReady',
  },
});

const CommonStatusLine = ({
  document,
  documentUploadStatus,
}: {
  document: Document;
  documentUploadStatus?: UploadManagerStatus;
}) => {
  const intl = useIntl();

  return (
    <Box align="center" direction="row" gap="xsmall">
      <Text weight="bold">{intl.formatMessage(messages.title)}:</Text>
      <ObjectStatusPicker
        object={document}
        uploadStatus={documentUploadStatus}
      />
    </Box>
  );
};

interface DashboardDocumentProps {
  document: Document;
}

const DashboardDocument = (props: DashboardDocumentProps) => {
  const intl = useIntl();

  const { uploadManagerState } = useUploadManager();
  const { document } = useDocument((state) => ({
    document: state.getDocument(props.document),
  }));
  const documentUploadState = uploadManagerState[document.id]?.status;

  useEffect(() => {
    if ([PENDING, PROCESSING].includes(document.upload_state)) {
      const timeoutId = window.setTimeout(() => {
        pollForTrack(modelName.DOCUMENTS, document.id);
      }, 1000 * 10);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [document.id, document.upload_state]);

  if (document.upload_state === READY) {
    return (
      <Box pad="small" justify="space-around" style={{ flexGrow: 1 }}>
        <Box direction="row" gap="xsmall">
          <Box margin="small">
            <CommonStatusLine
              document={document}
              documentUploadStatus={documentUploadState}
            />
            <Text color={colorsTokens['greyscale-800']}>
              {intl.formatMessage(messages[READY])}
            </Text>
            <Box direction="row" margin={{ top: 'small' }} gap="xxsmall">
              <Text weight="bold">
                {intl.formatMessage(messages.filename)}:
              </Text>
              <Text color={colorsTokens['greyscale-800']}>
                {document.filename}
              </Text>
            </Box>
          </Box>
          <Box margin={{ horizontal: 'auto' }} justify="center">
            <DocumentPlayer document={document} />
          </Box>
        </Box>
        <Box margin="small">
          <DashboardDocumentTitleForm document={document} />
        </Box>
        <DashboardDocumentPaneButtons document={document} />
      </Box>
    );
  }

  if (
    [ERROR, PROCESSING].includes(document.upload_state) ||
    (document.upload_state === PENDING &&
      uploadManagerState[document.id]?.status === UploadManagerStatus.SUCCESS)
  ) {
    return (
      <Box pad="small" justify="space-around" style={{ flexGrow: 1 }}>
        <CommonStatusLine
          document={document}
          documentUploadStatus={documentUploadState}
        />
        <DashboardDocumentPaneButtons document={document} />
      </Box>
    );
  }

  if (
    document.upload_state === PENDING &&
    uploadManagerState[document.id]?.status === UploadManagerStatus.UPLOADING
  ) {
    return (
      <Box pad="small" justify="space-around" style={{ flexGrow: 1 }}>
        <CommonStatusLine
          document={document}
          documentUploadStatus={documentUploadState}
        />
        <Box margin={{ vertical: 'small' }}>
          <UploadableObjectProgress
            progress={uploadManagerState[document.id].progress}
          />
        </Box>
        <DashboardDocumentPaneButtons document={document} />
      </Box>
    );
  }

  return (
    <Box pad="small" justify="space-around" style={{ flexGrow: 1 }}>
      <CommonStatusLine
        document={document}
        documentUploadStatus={documentUploadState}
      />
      {document.upload_state === PENDING &&
        intl.formatMessage(messages[PENDING])}
      <DashboardDocumentPaneButtons document={document} />
    </Box>
  );
};

export default DashboardDocument;

import { Box } from 'grommet';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { DashboardInternalHeading } from 'components/Dashboard/DashboardInternalHeading';
import {
  UploadManagerStatus,
  useUploadManager,
  useDocument,
  Document,
  modelName,
  uploadState,
  UploadableObjectProgress,
  ObjectStatusPicker,
} from 'lib-components';
import { pollForTrack } from 'data/sideEffects/pollForTrack';

import { DashboardDocumentTitleForm } from './DashboardDocumentTitleForm';
import { DashboardDocumentPaneButtons } from './DashboardDocumentPaneButtons';
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

const DashboardDocumentInnerContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 1rem;
`;

const DashboardDocumentInternalHeading = styled(DashboardInternalHeading)`
  padding: 0 1rem 0 0;
`;

const CommonStatusLine = ({
  document,
  documentUploadStatus,
}: {
  document: Document;
  documentUploadStatus?: UploadManagerStatus;
}) => (
  <Box align={'center'} direction={'row'}>
    <DashboardDocumentInternalHeading>
      <FormattedMessage {...messages.title} />
    </DashboardDocumentInternalHeading>
    <ObjectStatusPicker object={document} uploadStatus={documentUploadStatus} />
  </Box>
);

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
      window.setTimeout(async () => {
        await pollForTrack(modelName.DOCUMENTS, document.id);
      }, 1000 * 10);
    }
  }, []);

  if (document.upload_state === READY) {
    return (
      <DashboardDocumentInnerContainer>
        <Box direction={'row'}>
          <Box basis={'1/2'} margin={'small'}>
            <CommonStatusLine
              document={document}
              documentUploadStatus={documentUploadState}
            />
            {intl.formatMessage(messages[READY])}
            <Box align={'center'} direction={'row'} margin={{ top: 'small' }}>
              <DashboardDocumentInternalHeading>
                {intl.formatMessage(messages.filename)}
              </DashboardDocumentInternalHeading>
              <div>{document.filename}</div>
            </Box>
          </Box>
          <Box basis={'1/2'} margin={'small'}>
            <DocumentPlayer document={document} />
          </Box>
        </Box>
        <Box margin={'small'}>
          <DashboardDocumentTitleForm document={document} />
        </Box>
        <DashboardDocumentPaneButtons document={document} />
      </DashboardDocumentInnerContainer>
    );
  }

  if (
    [ERROR, PROCESSING].includes(document.upload_state) ||
    (document.upload_state === PENDING &&
      uploadManagerState[document.id]?.status === UploadManagerStatus.SUCCESS)
  ) {
    return (
      <DashboardDocumentInnerContainer>
        <CommonStatusLine
          document={document}
          documentUploadStatus={documentUploadState}
        />
        <DashboardDocumentPaneButtons document={document} />
      </DashboardDocumentInnerContainer>
    );
  }

  if (
    document.upload_state === PENDING &&
    uploadManagerState[document.id]?.status === UploadManagerStatus.UPLOADING
  ) {
    return (
      <DashboardDocumentInnerContainer>
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
      </DashboardDocumentInnerContainer>
    );
  }

  return (
    <DashboardDocumentInnerContainer>
      <CommonStatusLine
        document={document}
        documentUploadStatus={documentUploadState}
      />
      {document.upload_state === PENDING &&
        intl.formatMessage(messages[PENDING])}
      <DashboardDocumentPaneButtons document={document} />
    </DashboardDocumentInnerContainer>
  );
};

export default DashboardDocument;
